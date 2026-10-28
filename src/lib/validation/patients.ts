import { z } from "zod";

export const bloodTypeSchema = z.enum([
  "APositive",
  "ANegative",
  "BPositive",
  "BNegative",
  "ABPositive",
  "ABNegative",
  "OPositive",
  "ONegative",
]);

export const patientRemedySchema = z.object({
  id: z.string(),
  remedy: z.string(),
  quantity: z.number(),
});

export const patientSchema = z.object({
  id: z.string(),
  name: z.string(),
  birthdate: z.string(),
  is_male: z.boolean(),
  blood_type: bloodTypeSchema,
  remedies: z.array(patientRemedySchema),
});

export const patientsResponseSchema = z.array(patientSchema);

export type BloodType = z.infer<typeof bloodTypeSchema>;
export type PatientRemedy = z.infer<typeof patientRemedySchema>;
export type PatientRow = z.infer<typeof patientSchema>;

export const bloodTypeLabels: Record<BloodType, string> = {
  APositive: "A+",
  ANegative: "A-",
  BPositive: "B+",
  BNegative: "B-",
  ABPositive: "AB+",
  ABNegative: "AB-",
  OPositive: "O+",
  ONegative: "O-",
};

export const bloodTypeOptions = (Object.keys(bloodTypeLabels) as BloodType[]).map((value) => ({
  value,
  label: bloodTypeLabels[value],
}));

export const remedyOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const remediesCatalogSchema = z.array(remedyOptionSchema);

export type RemedyOption = z.infer<typeof remedyOptionSchema>;

export const patientRemedyInputSchema = z.object({
  remedy: z.uuid("Selecione o medicamento."),
  quantity: z.number("Informe a quantidade.").int("Informe uma quantidade inteira.").min(0, "A quantidade deve ser no mínimo 0."),
});

export const patientRemediesInputSchema = z.array(patientRemedyInputSchema);

export type PatientRemedyInput = z.infer<typeof patientRemedyInputSchema>;

export const createPatientSchema = z.object({
  name: z.string().trim().min(3, "O nome precisa de pelo menos 3 caracteres."),
  birthdate: z.iso
    .date("Informe uma data de nascimento válida.")
    .refine((value) => new Date(`${value}T00:00:00`) <= new Date(), "A data de nascimento não pode ser no futuro."),
  is_male: z.boolean(),
  blood_type: bloodTypeSchema,
  remedies: patientRemediesInputSchema,
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
