"use client";

import { Armchair, Footprints, type Icon, PersonStanding, RotateCw } from "@/components/icons";

import { cn } from "@/lib/utils";
import type { LivePhase } from "@/lib/tug/live-phase-tracker";

export interface PhaseLogEntry {
  phase: LivePhase;
  timestampMs: number;
}

const PHASE_META: Record<LivePhase, { label: string; icon: Icon }> = {
  sentado: { label: "Sentado", icon: Armchair },
  parado: { label: "Em pé", icon: PersonStanding },
  caminhando: { label: "Caminhando", icon: Footprints },
  virando: { label: "Virando", icon: RotateCw },
};

const MAX_VISIBLE = 5;

function formatElapsed(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function TugPhaseLog({ entries }: { readonly entries: PhaseLogEntry[] }) {
  if (entries.length === 0) return null;

  const visible = entries.slice(-MAX_VISIBLE);

  return (
    <div
      role="status"
      aria-label="Fases detectadas durante a gravação"
      className="absolute right-3 bottom-3 w-52 rounded-2xl border bg-popover/70 p-3 shadow-lg backdrop-blur-xl backdrop-saturate-150"
    >
      <div className="flex flex-col gap-1.5">
        {visible.map((entry, i) => {
          const isLast = i === visible.length - 1;
          const meta = PHASE_META[entry.phase];
          const PhaseIcon = meta.icon;

          return (
            <div
              key={`${entry.phase}-${entry.timestampMs}`}
              className={cn(
                "fade-in slide-in-from-bottom-1 flex animate-in items-center gap-2 text-xs transition-all duration-300",
                isLast ? "text-popover-foreground" : "text-muted-foreground/70",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                  isLast ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
                )}
              >
                <PhaseIcon className="size-3" strokeWidth={2.5} />
              </span>

              <span className="font-medium">{meta.label}</span>

              <span className="ml-auto text-muted-foreground tabular-nums">{formatElapsed(entry.timestampMs)}</span>

              {isLast && (
                <span className="relative flex size-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-success" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
