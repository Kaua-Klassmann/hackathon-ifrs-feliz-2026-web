import type { CreateAnalysisInput, ExpectedMetrics } from "@/lib/validation/analysis";

import type { TugMetrics } from "./tug-metrics";

const COURSE_DISTANCE_M = 6;
const SIT_TO_STAND_CYCLES = 5;
const DISCREPANCY_RATIO = 0.5;
const MIN_DISCREPANT_METRICS = 2;
export const MAX_DISCREPANT_ATTEMPTS = 3;

function round2(value: number): number {
  return Math.min(99.99, Math.round(value * 100) / 100);
}

export function toAnalysisInput(metrics: TugMetrics, date: string): CreateAnalysisInput | null {
  const { standUpMs, walkOutMs, walkBackMs, sitDownMs } = metrics.timings;
  if (standUpMs === null || walkOutMs === null || walkBackMs === null || sitDownMs === null) return null;
  if (metrics.cadence.cadenceStepsPerMinute === null) return null;

  const walkSeconds = (walkOutMs + walkBackMs) / 1000;
  if (walkSeconds <= 0) return null;

  return {
    velocity: round2(COURSE_DISTANCE_M / walkSeconds),
    time: round2(walkSeconds),
    steps: metrics.cadence.stepCount,
    cadence: Math.round(metrics.cadence.cadenceStepsPerMinute),
    bounce: round2(((standUpMs + sitDownMs) / 1000) * SIT_TO_STAND_CYCLES),
    time_to_up: round2(standUpMs / 1000),
    date,
  };
}

export function isDiscrepant(input: CreateAnalysisInput, expected: ExpectedMetrics): boolean {
  const pairs: [number, number][] = [
    [input.velocity, expected.velocity],
    [input.time, expected.time],
    [input.steps, expected.steps],
    [input.cadence, expected.cadence],
    [input.bounce, expected.bounce],
    [input.time_to_up, expected.time_to_up],
  ];

  const discrepantCount = pairs.filter(
    ([measured, norm]) => norm > 0 && Math.abs(measured - norm) / norm > DISCREPANCY_RATIO,
  ).length;

  return discrepantCount >= MIN_DISCREPANT_METRICS;
}
