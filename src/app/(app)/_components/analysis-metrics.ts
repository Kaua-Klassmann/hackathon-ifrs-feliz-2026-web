import type { AnalysisRow } from "@/lib/validation/analysis";

export type AnalysisMetricKey = "time" | "velocity" | "steps" | "cadence" | "bounce" | "time_to_up";

export interface AnalysisMetric {
  key: AnalysisMetricKey;
  diffKey: "time_diff" | "velocity_diff" | "steps_diff" | "cadence_diff" | "bounce_diff" | "time_to_up_diff";
  label: string;
  betterWhen: "higher" | "lower";
  formatValue: (value: number) => string;
}

export const analysisMetrics: AnalysisMetric[] = [
  { key: "time", diffKey: "time_diff", label: "Tempo", betterWhen: "lower", formatValue: (v) => `${v.toFixed(1)}s` },
  {
    key: "velocity",
    diffKey: "velocity_diff",
    label: "Velocidade",
    betterWhen: "higher",
    formatValue: (v) => `${v.toFixed(2)} m/s`,
  },
  { key: "steps", diffKey: "steps_diff", label: "Passos", betterWhen: "lower", formatValue: (v) => `${v}` },
  {
    key: "cadence",
    diffKey: "cadence_diff",
    label: "Cadência",
    betterWhen: "higher",
    formatValue: (v) => `${v}/min`,
  },
  {
    key: "bounce",
    diffKey: "bounce_diff",
    label: "TSL 5x",
    betterWhen: "lower",
    formatValue: (v) => `${v.toFixed(1)}s`,
  },
  {
    key: "time_to_up",
    diffKey: "time_to_up_diff",
    label: "Levantar",
    betterWhen: "lower",
    formatValue: (v) => `${v.toFixed(1)}s`,
  },
];

export const analysisMetricItems = analysisMetrics.map(({ key, label }) => ({ value: key, label }));

export function getAnalysisMetric(key: AnalysisMetricKey): AnalysisMetric {
  return analysisMetrics.find((metric) => metric.key === key) ?? analysisMetrics[0];
}

export function metricValue(analysis: AnalysisRow, metric: AnalysisMetric): number {
  return analysis[metric.key];
}

export function metricDiff(analysis: AnalysisRow, metric: AnalysisMetric): number | null {
  return analysis[metric.diffKey];
}
