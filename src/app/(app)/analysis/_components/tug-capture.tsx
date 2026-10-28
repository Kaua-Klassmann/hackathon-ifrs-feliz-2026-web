"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { FilesetResolver, PoseLandmarker, type PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import { toast } from "sonner";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { drawLandmarks } from "@/lib/tug/draw-landmarks";
import { LivePhaseTracker } from "@/lib/tug/live-phase-tracker";
import type { FrameSample } from "@/lib/tug/tug-types";
import { validateTugSession } from "@/lib/tug/validate-tug";

import { TugPhaseLog, type PhaseLogEntry } from "./tug-phase-log";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const STOP_BUFFER_MS = 800;
const AUTO_STOP_SIT_MS = 1500;

interface TugCaptureProps {
  readonly onFinish: (samples: FrameSample[]) => void;
  readonly autoStart?: boolean;
}

export function TugCapture({ onFinish, autoStart = false }: TugCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const samplesRef = useRef<FrameSample[]>([]);
  const startedAtRef = useRef<number>(0);
  const recordingRef = useRef(false);
  const autoStartedRef = useRef(false);
  const hasWalkedRef = useRef(false);
  const sitStartMsRef = useRef<number | null>(null);
  const autoStopFiredRef = useRef(false);
  const phaseTrackerRef = useRef<LivePhaseTracker | null>(null);
  if (phaseTrackerRef.current == null) {
    phaseTrackerRef.current = new LivePhaseTracker();
  }

  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [mirrored, setMirrored] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phaseLog, setPhaseLog] = useState<PhaseLogEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });
        if (!cancelled) {
          landmarkerRef.current = landmarker;
          setReady(true);
        }
      } catch (cause) {
        console.error("[analysis] pose_model_load_failed", { error: cause });
        if (!cancelled) setError("Não foi possível carregar o modelo de detecção de pose.");
      }
    })();

    return () => {
      cancelled = true;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let stream: MediaStream;

    navigator.mediaDevices
      .getUserMedia({ video: { width: 1280, height: 720, facingMode: { exact: "environment" } }, audio: false })
      .catch(() => navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false }))
      .then((s) => {
        stream = s;
        const facing = s.getVideoTracks()[0]?.getSettings().facingMode;
        setMirrored(facing !== "environment");
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError("Não foi possível acessar a câmera. Verifique a permissão no navegador."));

    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [ready]);

  const handleStart = useCallback(() => {
    samplesRef.current = [];
    phaseTrackerRef.current?.reset();
    hasWalkedRef.current = false;
    sitStartMsRef.current = null;
    autoStopFiredRef.current = false;
    setPhaseLog([]);
    startedAtRef.current = performance.now();
    recordingRef.current = true;
    setRecording(true);
  }, []);

  const handleStop = useCallback(() => {
    if (!recordingRef.current) return;
    setFinishing(true);
    setTimeout(() => {
      recordingRef.current = false;
      setRecording(false);
      setFinishing(false);

      const result = validateTugSession(samplesRef.current);

      if (!result.valid) {
        toast.error(result.reason ?? "Teste inválido, tente novamente.", {
          action: { label: "Tentar novamente", onClick: handleStart },
          duration: 8000,
        });
        return;
      }

      onFinish(samplesRef.current);
    }, STOP_BUFFER_MS);
  }, [onFinish, handleStart]);

  useEffect(() => {
    function detectLoop() {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (video && landmarker && video.readyState >= 2) {
        const timestampMs = performance.now();
        const result: PoseLandmarkerResult = landmarker.detectForVideo(video, timestampMs);
        const pose = result.landmarks[0];

        if (pose) {
          drawLandmarks(canvasRef.current, video, pose);

          if (recordingRef.current) {
            samplesRef.current.push({
              timestampMs: timestampMs - startedAtRef.current,
              landmarks: pose.map((p) => ({
                x: p.x,
                y: p.y,
                z: p.z,
                visibility: p.visibility,
              })),
            });

            const update = phaseTrackerRef.current?.push(pose, timestampMs);
            if (update?.changed) {
              setPhaseLog((prev) => [
                ...prev,
                { phase: update.phase, timestampMs: timestampMs - startedAtRef.current },
              ]);
            }

            if (update) {
              if (update.phase === "caminhando") {
                hasWalkedRef.current = true;
                sitStartMsRef.current = null;
              } else if (update.phase === "sentado" && hasWalkedRef.current) {
                sitStartMsRef.current ??= timestampMs;
                if (timestampMs - sitStartMsRef.current >= AUTO_STOP_SIT_MS && !autoStopFiredRef.current) {
                  autoStopFiredRef.current = true;
                  handleStop();
                }
              } else if (update.phase !== "sentado") {
                sitStartMsRef.current = null;
              }
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(detectLoop);
    }

    rafRef.current = requestAnimationFrame(detectLoop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [handleStop]);

  useEffect(() => {
    if (autoStart && ready && !autoStartedRef.current) {
      autoStartedRef.current = true;
      handleStart();
    }
  }, [autoStart, ready, handleStart]);

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn("h-full w-full object-cover", mirrored && "-scale-x-100")}
      />
      <canvas
        ref={canvasRef}
        className={cn("pointer-events-none absolute inset-0 h-full w-full", mirrored && "-scale-x-100")}
      />
      {!ready && !error && (
        <>
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Spinner aria-hidden />
            Carregando modelo de detecção de pose…
          </div>
        </>
      )}

      <div className="absolute top-3 right-3">
        {recording || finishing ? (
          <Button size="sm" variant="secondary" onClick={handleStop} disabled={finishing}>
            {finishing && <Spinner aria-hidden />}
            {finishing ? "Finalizando…" : "Finalizar teste"}
          </Button>
        ) : (
          <Button size="sm" onClick={handleStart} disabled={!ready}>
            Iniciar teste
          </Button>
        )}
      </div>

      <TugPhaseLog entries={phaseLog} />

      {error && (
        <Alert variant="destructive" className="absolute inset-x-3 bottom-3 w-auto">
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}
    </div>
  );
}
