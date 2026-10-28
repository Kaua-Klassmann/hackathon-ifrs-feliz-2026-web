"use client";

import { Activity, Footprints, Gauge, type Icon, ScanEye } from "@/components/icons";

import { Card, CardContent } from "@/components/ui/card";
import type { TugMetrics } from "@/lib/tug/tug-metrics";

function formatSeconds(ms: number | null): string {
  if (ms === null) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatPercent(v: number | null): string {
  if (v === null) return "—";
  return `${Math.round(v * 100)}%`;
}

function TimingBlock({ label, ms }: { readonly label: string; readonly ms: number | null }) {
  return (
    <div className="rounded-xl bg-muted p-3 text-center">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-semibold text-lg tabular-nums">{formatSeconds(ms)}</p>
    </div>
  );
}

function MetricRow({ icon: MetricIcon, label, value }: { readonly icon: Icon; readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <MetricIcon className="size-4 shrink-0" />
        {label}
      </span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function sumPhaseTimes(timings: TugMetrics["timings"]): number | null {
  const phases = [timings.standUpMs, timings.walkOutMs, timings.walkBackMs, timings.sitDownMs];
  if (phases.some((ms) => ms === null)) return null;
  return phases.reduce((total: number, ms) => total + (ms ?? 0), 0);
}

export function TugResults({ metrics }: { readonly metrics: TugMetrics }) {
  const tugTimeMs = sumPhaseTimes(metrics.timings) ?? metrics.totalDurationMs;

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardContent className="flex flex-col gap-4">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">Tempo total do teste</p>
          <p className="font-semibold text-4xl tabular-nums">{formatSeconds(tugTimeMs)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <TimingBlock label="Levantar" ms={metrics.timings.standUpMs} />
          <TimingBlock label="Ida" ms={metrics.timings.walkOutMs} />
          <TimingBlock label="Volta" ms={metrics.timings.walkBackMs} />
          <TimingBlock label="Sentar" ms={metrics.timings.sitDownMs} />
        </div>

        <div className="flex flex-col gap-3 border-t pt-4">
          <MetricRow
            icon={Gauge}
            label="Velocidade média de marcha"
            value={
              metrics.gaitSpeed.averageByPhaseDistance !== null
                ? metrics.gaitSpeed.averageByPhaseDistance.toFixed(3)
                : "—"
            }
          />
          <MetricRow
            icon={Gauge}
            label="Velocidade de pico"
            value={metrics.gaitSpeed.peak !== null ? metrics.gaitSpeed.peak.toFixed(3) : "—"}
          />
          <MetricRow icon={Footprints} label="Passos detectados" value={`${metrics.cadence.stepCount}`} />
          <MetricRow
            icon={Activity}
            label="Cadência"
            value={
              metrics.cadence.cadenceStepsPerMinute !== null
                ? `${Math.round(metrics.cadence.cadenceStepsPerMinute)} passos/min`
                : "—"
            }
          />
          <MetricRow icon={ScanEye} label="Confiança da detecção" value={formatPercent(metrics.averageLandmarkConfidence)} />
        </div>
      </CardContent>
    </Card>
  );
}
