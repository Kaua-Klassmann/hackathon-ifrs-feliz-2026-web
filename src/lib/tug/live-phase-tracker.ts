import { computeFrameMetrics } from "./pose-metrics";
import type { PoseLandmark } from "./tug-types";

export type LivePhase = "sentado" | "parado" | "caminhando" | "virando";

const SIT_KNEE_ANGLE_MAX = 110;
const STAND_KNEE_ANGLE_MIN = 155;
const HOLD_MS = 350;
const MOVEMENT_WINDOW_MS = 500;
const MOVEMENT_THRESHOLD = 0.015;
const TURN_WINDOW_MS = 900;
const TURN_COOLDOWN_MS = 900;

interface HistoryPoint {
  timestampMs: number;
  hipX: number;
  hipY: number;
  torsoScale: number;
  kneeAngle: number;
}

export interface PhaseUpdate {
  phase: LivePhase;
  changed: boolean;
}

export class LivePhaseTracker {
  private history: HistoryPoint[] = [];
  private currentPhase: LivePhase | null = null;
  private pendingPhase: LivePhase | null = null;
  private pendingSinceMs = 0;
  private lastTurnAtMs = -Infinity;

  push(landmarks: PoseLandmark[], timestampMs: number): PhaseUpdate | null {
    const m = computeFrameMetrics(landmarks, timestampMs);
    this.history.push({
      timestampMs,
      hipX: m.hipCenter.x,
      hipY: m.hipCenter.y,
      torsoScale: m.torsoScale,
      kneeAngle: m.kneeAngle,
    });

    const cutoffMs = timestampMs - Math.max(MOVEMENT_WINDOW_MS, TURN_WINDOW_MS) * 2;
    while (this.history.length > 2 && this.history[0].timestampMs < cutoffMs) this.history.shift();

    const candidate = this.classify(timestampMs);

    if (candidate === this.currentPhase) {
      this.pendingPhase = null;
      return this.currentPhase ? { phase: this.currentPhase, changed: false } : null;
    }

    if (candidate !== this.pendingPhase) {
      this.pendingPhase = candidate;
      this.pendingSinceMs = timestampMs;
      return this.currentPhase ? { phase: this.currentPhase, changed: false } : null;
    }

    if (timestampMs - this.pendingSinceMs >= HOLD_MS) {
      this.currentPhase = candidate;
      this.pendingPhase = null;
      if (candidate === "virando") this.lastTurnAtMs = timestampMs;
      return { phase: candidate, changed: true };
    }

    return this.currentPhase ? { phase: this.currentPhase, changed: false } : null;
  }

  reset() {
    this.history = [];
    this.currentPhase = null;
    this.pendingPhase = null;
    this.pendingSinceMs = 0;
    this.lastTurnAtMs = -Infinity;
  }

  private classify(nowMs: number): LivePhase {
    const last = this.history[this.history.length - 1];

    if (last.kneeAngle < SIT_KNEE_ANGLE_MAX) return "sentado";

    if (last.kneeAngle < STAND_KNEE_ANGLE_MIN) {
      return this.currentPhase ?? "parado";
    }

    const moveStart = this.findAtOrAfter(nowMs - MOVEMENT_WINDOW_MS);
    const movement = moveStart ? Math.hypot(last.hipX - moveStart.hipX, last.hipY - moveStart.hipY) : 0;

    if (movement < MOVEMENT_THRESHOLD) return "parado";

    if (nowMs - this.lastTurnAtMs > TURN_COOLDOWN_MS) {
      const turnStart = this.findAtOrAfter(nowMs - TURN_WINDOW_MS);
      if (turnStart) {
        const midIdx = Math.floor((this.history.length - 1) / 2);
        const mid = this.history[midIdx];
        const earlyTrend = mid.torsoScale - turnStart.torsoScale;
        const lateTrend = last.torsoScale - mid.torsoScale;
        if (earlyTrend !== 0 && Math.sign(earlyTrend) !== Math.sign(lateTrend) && lateTrend !== 0) {
          return "virando";
        }
      }
    }

    return "caminhando";
  }

  private findAtOrAfter(timestampMs: number): HistoryPoint | undefined {
    return this.history.find((p) => p.timestampMs >= timestampMs);
  }
}
