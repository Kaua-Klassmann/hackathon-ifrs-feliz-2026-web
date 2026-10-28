import "server-only";

import {
  type AnalysisDiffs,
  type AnalysisRow,
  analysesResponseSchema,
  analysisDiffsSchema,
  type CreateAnalysisInput,
  type ExpectedMetrics,
  expectedMetricsSchema,
} from "@/lib/validation/analysis";

import { apiFetch } from "./client";
import { type ApiResult, err, HTTP_UNAUTHORIZED, httpError } from "./errors";
import { getSessionToken } from "./session";

async function authHeader(): Promise<{ Authorization: string } | null> {
  const token = await getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
}

export async function getPatientAnalyses(patientId: string): Promise<ApiResult<AnalysisRow[]>> {
  const headers = await authHeader();
  if (!headers) {
    return err(httpError(HTTP_UNAUTHORIZED));
  }

  return apiFetch(`/analysis/${patientId}`, analysesResponseSchema, { headers });
}

export async function getPatientMetrics(patientId: string): Promise<ApiResult<ExpectedMetrics>> {
  const headers = await authHeader();
  if (!headers) {
    return err(httpError(HTTP_UNAUTHORIZED));
  }

  return apiFetch(`/metrics/${patientId}`, expectedMetricsSchema, { headers });
}

export async function createAnalysis(
  patientId: string,
  input: CreateAnalysisInput,
): Promise<ApiResult<AnalysisDiffs>> {
  const headers = await authHeader();
  if (!headers) {
    return err(httpError(HTTP_UNAUTHORIZED));
  }

  return apiFetch(`/analysis/${patientId}`, analysisDiffsSchema, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
}
