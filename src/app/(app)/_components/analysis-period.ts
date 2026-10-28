import { parseISO, subMonths } from "date-fns";

import type { AnalysisRow } from "@/lib/validation/analysis";

export const periodOptions = [
  { value: "3m", label: "3 meses", months: 3 },
  { value: "6m", label: "6 meses", months: 6 },
  { value: "12m", label: "1 ano", months: 12 },
  { value: "all", label: "Tudo", months: null },
] as const;

export type PeriodValue = (typeof periodOptions)[number]["value"];

export const periodItems = periodOptions.map(({ value, label }) => ({ value, label }));

export function filterByPeriod(analyses: AnalysisRow[], period: PeriodValue): AnalysisRow[] {
  const option = periodOptions.find((candidate) => candidate.value === period);
  const cutoff = option?.months ? subMonths(new Date(), option.months) : null;
  return analyses
    .filter((analysis) => !cutoff || parseISO(analysis.date) >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
}
