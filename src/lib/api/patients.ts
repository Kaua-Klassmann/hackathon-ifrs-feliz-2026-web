import "server-only";

import { z } from "zod";

import {
  type CreatePatientInput,
  type PatientRemedyInput,
  type PatientRow,
  patientsResponseSchema,
  remediesCatalogSchema,
  type RemedyOption,
} from "@/lib/validation/patients";

import { apiFetch } from "./client";
import { type ApiResult, err, HTTP_UNAUTHORIZED, httpError } from "./errors";
import { getSessionToken } from "./session";

async function authHeader(): Promise<{ Authorization: string } | null> {
  const token = await getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
}

export async function getPatients(): Promise<ApiResult<PatientRow[]>> {
  const headers = await authHeader();
  if (!headers) {
    return err(httpError(HTTP_UNAUTHORIZED));
  }

  return apiFetch("/patients", patientsResponseSchema, { headers });
}

export async function createPatient(input: CreatePatientInput): Promise<ApiResult<string>> {
  const headers = await authHeader();
  if (!headers) {
    return err(httpError(HTTP_UNAUTHORIZED));
  }

  return apiFetch("/patients", z.string(), {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: input.name,
      birth_date: input.birthdate,
      blood_type: input.blood_type,
      is_male: input.is_male,
      remedies: input.remedies,
    }),
  });
}

export async function getRemedies(): Promise<ApiResult<RemedyOption[]>> {
  const headers = await authHeader();
  if (!headers) {
    return err(httpError(HTTP_UNAUTHORIZED));
  }

  return apiFetch("/remedies", remediesCatalogSchema, { headers });
}

export async function updatePatientRemedies(
  patientId: string,
  remedies: PatientRemedyInput[],
): Promise<ApiResult<null>> {
  const headers = await authHeader();
  if (!headers) {
    return err(httpError(HTTP_UNAUTHORIZED));
  }

  return apiFetch(`/patients/${patientId}/remedies`, z.null(), {
    method: "PUT",
    headers,
    body: JSON.stringify(remedies),
  });
}

export async function deletePatient(patientId: string): Promise<ApiResult<null>> {
  const headers = await authHeader();
  if (!headers) {
    return err(httpError(HTTP_UNAUTHORIZED));
  }

  return apiFetch(`/patients/${patientId}`, z.null(), {
    method: "DELETE",
    headers,
  });
}
