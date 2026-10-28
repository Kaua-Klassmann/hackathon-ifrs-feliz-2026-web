"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { registerAction } from "@/app/(auth)/actions";
import { HTTP_CONFLICT } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { emailSchema, nameSchema, passwordSchema } from "@/lib/validation/auth";

import { PasswordInput } from "./password-input";
import { PasswordRequirements } from "./password-requirements";

const formSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: "Repita a senha para confirmar." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export function RegisterForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const isPending = form.formState.isSubmitting || isRedirecting;
  const isSubmitted = form.formState.isSubmitted;
  const passwordValue = useWatch({ control: form.control, name: "password" }) ?? "";
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const showPasswordRequirements = isPasswordFocused || passwordValue.length > 0;

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const result = await registerAction({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    if (result.ok) {
      setIsRedirecting(true);
      toast.success(`Conta criada. Bem-vindo, ${result.data.user.name}!`);
      router.push("/");
      return;
    }

    const { error } = result;

    if (error.status === HTTP_CONFLICT) {
      form.setError("email", { message: error.message }, { shouldFocus: true });
      return;
    }

    toast.error(error.message);
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldSet className="min-w-0" disabled={isPending}>
        <FieldGroup className="gap-4">
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-name">Nome</FieldLabel>
                <Input
                  {...field}
                  id="register-name"
                  type="text"
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  autoFocus
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-email">E-mail</FieldLabel>
                <Input
                  {...field}
                  id="register-email"
                  type="email"
                  placeholder="voce@exemplo.com"
                  autoComplete="email"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-password">Senha</FieldLabel>
                <PasswordInput
                  {...field}
                  id="register-password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={showPasswordRequirements ? "register-password-requirements" : undefined}
                  disabled={isPending}
                  onFocus={() => setIsPasswordFocused(true)}
                  onChange={(event) => {
                    field.onChange(event);

                    if (form.getValues("confirmPassword")) {
                      void form.trigger("confirmPassword");
                    }
                  }}
                  onBlur={() => {
                    field.onBlur();
                    setIsPasswordFocused(false);
                  }}
                />
                <div
                  aria-hidden={!showPasswordRequirements}
                  className={cn(
                    "grid transition-all duration-200 ease-out motion-reduce:transition-none",
                    showPasswordRequirements ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="overflow-hidden">
                    <PasswordRequirements
                      id="register-password-requirements"
                      value={passwordValue}
                      showErrors={isSubmitted && fieldState.invalid}
                    />
                  </div>
                </div>
                {!showPasswordRequirements && fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-confirm-password">Confirmar senha</FieldLabel>
                <PasswordInput
                  {...field}
                  id="register-confirm-password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                  disabled={isPending}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>
      </FieldSet>
      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending && <Spinner aria-hidden />}
        {isPending ? "Cadastrando..." : "Cadastrar"}
      </Button>
    </form>
  );
}
