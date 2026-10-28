"use client";

import * as React from "react";

import { format } from "date-fns";
import { toast } from "sonner";

import { PersonStanding } from "@/components/icons";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { isDiscrepant, MAX_DISCREPANT_ATTEMPTS, toAnalysisInput } from "@/lib/tug/to-analysis";
import { computeTugMetrics, type TugMetrics } from "@/lib/tug/tug-metrics";
import type { FrameSample } from "@/lib/tug/tug-types";
import type { AnalysisDiffs, CreateAnalysisInput, ExpectedMetrics } from "@/lib/validation/analysis";
import type { PatientRow } from "@/lib/validation/patients";

import { createAnalysisAction, getPatientMetricsAction } from "../../actions";
import { AnalysisFeedback } from "./analysis-feedback";
import { TugCapture } from "./tug-capture";
import { TugResults } from "./tug-results";

type Phase = "intro" | "countdown" | "capture" | "saving" | "results";

const COUNTDOWN_SECONDS = 5;

export function AnalysisFlow({ patients }: { readonly patients: PatientRow[] }) {
  const [patientId, setPatientId] = React.useState<string | null>(patients[0]?.id ?? null);
  const [phase, setPhase] = React.useState<Phase>("intro");
  const [count, setCount] = React.useState(COUNTDOWN_SECONDS);
  const [metrics, setMetrics] = React.useState<TugMetrics | null>(null);
  const [expected, setExpected] = React.useState<ExpectedMetrics | null>(null);
  const [attempts, setAttempts] = React.useState(0);
  const [savedInput, setSavedInput] = React.useState<CreateAnalysisInput | null>(null);
  const [feedback, setFeedback] = React.useState<AnalysisDiffs | null>(null);

  const patientItems = React.useMemo(
    () => patients.map((patient) => ({ value: patient.id, label: patient.name })),
    [patients],
  );

  React.useEffect(() => {
    if (phase !== "countdown") return;
    const timer = setTimeout(() => {
      if (count <= 1) {
        setPhase("capture");
        return;
      }
      setCount((c) => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [phase, count]);

  function handlePatientChange(nextId: string | null) {
    if (!nextId) return;
    setPatientId(nextId);
    setExpected(null);
    setAttempts(0);
    setFeedback(null);
    setSavedInput(null);
  }

  function handleStartClick() {
    if (!patientId) return;
    if (!expected) {
      void getPatientMetricsAction(patientId).then((result) => {
        if (result.ok) setExpected(result.data);
      });
    }
    setCount(COUNTDOWN_SECONDS);
    setPhase("countdown");
  }

  async function handleFinish(samples: FrameSample[]) {
    if (!patientId) {
      setPhase("intro");
      return;
    }

    const computed = computeTugMetrics(samples);
    if (!computed) {
      toast.error("Não foi possível calcular as métricas do teste. Tente novamente.");
      setPhase("intro");
      return;
    }

    const input = toAnalysisInput(computed, format(new Date(), "yyyy-MM-dd"));
    if (!input) {
      toast.error("Não foi possível medir todas as fases do teste. Refaça a gravação.");
      setPhase("intro");
      return;
    }

    setMetrics(computed);
    setPhase("saving");

    let norm = expected;
    if (!norm) {
      const result = await getPatientMetricsAction(patientId);
      if (result.ok) {
        norm = result.data;
        setExpected(result.data);
      }
    }

    if (norm && isDiscrepant(input, norm) && attempts + 1 < MAX_DISCREPANT_ATTEMPTS) {
      const nextAttempt = attempts + 1;
      setAttempts(nextAttempt);
      toast.warning(
        `Resultado muito diferente do esperado (tentativa ${nextAttempt} de ${MAX_DISCREPANT_ATTEMPTS}). Refaça o teste para confirmar.`,
        { duration: 8000 },
      );
      setPhase("intro");
      return;
    }

    const saved = await createAnalysisAction(patientId, input);
    setSavedInput(input);
    setAttempts(0);

    if (!saved.ok) {
      toast.error(saved.error.message);
      setFeedback(null);
      setPhase("results");
      return;
    }

    toast.success("Análise salva no histórico.");
    setFeedback(saved.data);
    setPhase("results");
  }

  const patientName = patients.find((patient) => patient.id === patientId)?.name;

  if (phase === "results" && metrics) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-4 pb-2">
          <TugResults metrics={metrics} />
          {savedInput && feedback && <AnalysisFeedback input={savedInput} diffs={feedback} />}
          {savedInput && !feedback && (
            <p className="text-muted-foreground text-sm">A análise não foi salva — tente novamente.</p>
          )}
          <Button onClick={handleStartClick}>Refazer teste</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 justify-center">
      <div className="relative aspect-video h-full max-w-full overflow-hidden rounded-2xl bg-muted">
        {phase !== "capture" && <Skeleton className="absolute inset-0 h-full w-full rounded-none" />}

        {phase === "intro" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-xl border bg-background">
              <PersonStanding aria-hidden className="size-6 text-muted-foreground" />
            </span>
            <div className="max-w-md space-y-1">
              <p className="font-medium">Teste TUG</p>
              <p className="text-muted-foreground text-sm">
                Posicione o paciente sentado, de frente para o percurso de caminhada. Você terá {COUNTDOWN_SECONDS}{" "}
                segundos para se preparar antes de a gravação começar, e o teste encerra sozinho quando o paciente
                sentar novamente.
              </p>
            </div>
            {patients.length === 0 ? (
              <p className="text-muted-foreground text-sm">Cadastre um paciente para iniciar uma análise.</p>
            ) : (
              <>
                <Select items={patientItems} value={patientId} onValueChange={handlePatientChange}>
                  <SelectTrigger className="w-64" aria-label="Paciente avaliado">
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Pacientes</SelectLabel>
                      {patientItems.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button onClick={handleStartClick} disabled={!patientId}>
                  Iniciar gravação
                </Button>
              </>
            )}
          </div>
        )}

        {phase === "countdown" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="font-semibold text-6xl tabular-nums">{count}</span>
            <p className="text-muted-foreground text-sm">Prepare-se…</p>
          </div>
        )}

        {phase === "saving" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Spinner aria-hidden />
            <p className="text-muted-foreground text-sm">
              Comparando com os valores esperados{patientName ? ` de ${patientName}` : ""}…
            </p>
          </div>
        )}

        {phase === "capture" && <TugCapture autoStart onFinish={handleFinish} />}
      </div>
    </div>
  );
}
