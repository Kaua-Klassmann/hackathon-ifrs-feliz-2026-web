"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createAnalysis, getPatientAnalyses, getPatientMetrics } from "@/lib/api/analysis";
import { type ApiResult, err, MESSAGES } from "@/lib/api/errors";
import {
  type AnalysisDiffs,
  type AnalysisRow,
  type CreateAnalysisInput,
  createAnalysisInputSchema,
  type ExpectedMetrics,
} from "@/lib/validation/analysis";

export async function getPatientAnalysesAction(patientId: string): Promise<ApiResult<AnalysisRow[]>> {
  const parsed = z.guid().safeParse(patientId);
  if (!parsed.success) {
    return err({ type: "parse", message: MESSAGES.invalidData });
  }

  return getPatientAnalyses(parsed.data);
}

export async function getPatientMetricsAction(patientId: string): Promise<ApiResult<ExpectedMetrics>> {
  const parsed = z.guid().safeParse(patientId);
  if (!parsed.success) {
    return err({ type: "parse", message: MESSAGES.invalidData });
  }

  return getPatientMetrics(parsed.data);
}

export async function createAnalysisAction(
  patientId: string,
  input: CreateAnalysisInput,
): Promise<ApiResult<AnalysisDiffs>> {
  const parsedId = z.guid().safeParse(patientId);
  const parsedInput = createAnalysisInputSchema.safeParse(input);
  if (!parsedId.success || !parsedInput.success) {
    return err({ type: "parse", message: MESSAGES.invalidData });
  }

  const result = await createAnalysis(parsedId.data, parsedInput.data);
  if (result.ok) {
    revalidatePath("/");
    revalidatePath("/history");
  }

  return result;
}
