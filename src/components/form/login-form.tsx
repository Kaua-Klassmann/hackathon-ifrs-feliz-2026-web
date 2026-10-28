"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { loginAction } from "@/app/(auth)/actions";
import { HTTP_UNAUTHORIZED } from "@/lib/api/errors";
import { emailSchema, passwordSchema } from "@/lib/validation/auth";

import { PasswordInput } from "./password-input";

const formSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export function LoginForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const isPending = form.formState.isSubmitting || isRedirecting;

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const result = await loginAction(data);

    if (result.ok) {
      setIsRedirecting(true);
      toast.success(`Bem-vindo, ${result.data.user.name}!`);
      router.push("/");
      return;
    }

    const { error } = result;

    if (error.status === HTTP_UNAUTHORIZED) {
      form.setError("email", { message: "" });
      form.setError("password", { message: error.message }, { shouldFocus: true });
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
            name="email"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="login-email">E-mail</FieldLabel>
                <Input
                  {...field}
                  id="login-email"
                  type="email"
                  placeholder="voce@exemplo.com"
                  autoComplete="email"
                  autoFocus
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
                <FieldLabel htmlFor="login-password">Senha</FieldLabel>
                <PasswordInput
                  {...field}
                  id="login-password"
                  placeholder="••••••••"
                  autoComplete="current-password"
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
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
