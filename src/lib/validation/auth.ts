import { z } from "zod";

export type PasswordRequirement = {
  readonly id: string;
  readonly label: string;
  readonly error: string;
  readonly test: (value: string) => boolean;
};

export const passwordRequirements: readonly PasswordRequirement[] = [
  {
    id: "length",
    label: "No mínimo 8 caracteres",
    error: "A senha deve ter no mínimo 8 caracteres.",
    test: (value) => value.length >= 8,
  },
  {
    id: "lowercase",
    label: "Uma letra minúscula",
    error: "A senha precisa de uma letra minúscula.",
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: "uppercase",
    label: "Uma letra maiúscula",
    error: "A senha precisa de uma letra maiúscula.",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "digit",
    label: "Um número",
    error: "A senha precisa de um número.",
    test: (value) => /\d/.test(value),
  },
  {
    id: "special",
    label: "Um caractere especial",
    error: "A senha precisa de um caractere especial.",
    test: (value) => /[^a-zA-Z\d]/.test(value),
  },
];

export const emailSchema = z.email({ message: "Informe um e-mail válido." });

export const nameSchema = z.string().min(3, { message: "O nome deve ter no mínimo 3 caracteres." });

export const passwordSchema = z.string().superRefine((value, ctx) => {
  const failed = passwordRequirements.find((requirement) => !requirement.test(value));

  if (failed) {
    ctx.addIssue({ code: "custom", message: failed.error });
  }
});
