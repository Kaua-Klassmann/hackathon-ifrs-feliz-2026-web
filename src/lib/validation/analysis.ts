import { z } from "zod";

const decimalSchema = z.coerce.number();
const diffSchema = z.number().nullable();

export const analysisSchema = z.object({
  velocity: decimalSchema,
  velocity_diff: diffSchema,
  time: decimalSchema,
  time_diff: diffSchema,
  steps: z.number(),
  steps_diff: diffSchema,
  cadence: z.number(),
  cadence_diff: diffSchema,
  bounce: decimalSchema,
  bounce_diff: diffSchema,
  time_to_up: decimalSchema,
  time_to_up_diff: diffSchema,
  date: z.iso.date(),
});

export const analysesResponseSchema = z.array(analysisSchema);

export type AnalysisRow = z.infer<typeof analysisSchema>;

export function expectedValue(value: number, diffPercent: number | null): number | null {
  if (diffPercent === null) return null;
  const ratio = 1 + diffPercent / 100;
  if (ratio <= 0) return null;
  return value / ratio;
}

export const expectedMetricsSchema = z.object({
  velocity: decimalSchema,
  time: decimalSchema,
  steps: z.number(),
  cadence: z.number(),
  bounce: decimalSchema,
  time_to_up: decimalSchema,
});

export type ExpectedMetrics = z.infer<typeof expectedMetricsSchema>;

export const createAnalysisInputSchema = z.object({
  velocity: z.number().positive(),
  time: z.number().positive(),
  steps: z.number().int().min(0),
  cadence: z.number().int().min(0),
  bounce: z.number().min(0),
  time_to_up: z.number().min(0),
  date: z.iso.date(),
});

export type CreateAnalysisInput = z.infer<typeof createAnalysisInputSchema>;

export const analysisDiffsSchema = z.object({
  velocity_diff: diffSchema,
  time_diff: diffSchema,
  steps_diff: diffSchema,
  cadence_diff: diffSchema,
  bounce_diff: diffSchema,
  time_to_up_diff: diffSchema,
});

export type AnalysisDiffs = z.infer<typeof analysisDiffsSchema>;
