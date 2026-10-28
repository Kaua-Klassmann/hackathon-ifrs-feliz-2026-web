"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createPatient, deletePatient, updatePatientRemedies } from "@/lib/api/patients";
import { type ApiResult, err, MESSAGES } from "@/lib/api/errors";
import {
  type CreatePatientInput,
  createPatientSchema,
  type PatientRemedyInput,
  patientRemediesInputSchema,
} from "@/lib/validation/patients";

export async function createPatientAction(input: CreatePatientInput): Promise<ApiResult<string>> {
  const parsed = createPatientSchema.safeParse(input);
  if (!parsed.success) {
    return err({ type: "parse", message: MESSAGES.invalidData });
  }

  const result = await createPatient(parsed.data);
  if (result.ok) {
    revalidatePath("/patient");
  }

  return result;
}

export async function updatePatientRemediesAction(
  patientId: string,
  remedies: PatientRemedyInput[],
): Promise<ApiResult<null>> {
  const parsedId = z.guid().safeParse(patientId);
  const parsedRemedies = patientRemediesInputSchema.safeParse(remedies);
  if (!parsedId.success || !parsedRemedies.success) {
    return err({ type: "parse", message: MESSAGES.invalidData });
  }

  const result = await updatePatientRemedies(parsedId.data, parsedRemedies.data);
  if (result.ok) {
    revalidatePath("/patient");
  }

  return result;
}

export async function deletePatientAction(patientId: string): Promise<ApiResult<null>> {
  const parsed = z.guid().safeParse(patientId);
  if (!parsed.success) {
    return err({ type: "parse", message: MESSAGES.invalidData });
  }

  const result = await deletePatient(parsed.data);
  if (result.ok) {
    revalidatePath("/patient");
  }

  return result;
}
