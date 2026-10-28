import Link from "next/link";

import { Globe } from "@/components/icons";

import { APP_CONFIG } from "@/config/app-config";

import { RegisterForm } from "@/components/form/register-form";

export default function RegisterPage() {
  return (
    <>
      <div className="flex w-full justify-end">
        <div className="text-muted-foreground text-sm">
          Já tem uma conta?{" "}
          <Link className="text-foreground" href="/auth/login">
            Entrar
          </Link>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto py-8">
        <div className="mx-auto my-auto w-full space-y-8 sm:w-87.5">
          <div className="space-y-2 text-center">
            <h1 className="font-medium text-3xl">Criar sua conta</h1>
            <p className="text-muted-foreground text-sm">Informe seus dados para se cadastrar.</p>
          </div>
          <RegisterForm />
        </div>
      </div>

      <div className="flex w-full justify-between">
        <div className="text-sm">{APP_CONFIG.copyright}</div>
        <div className="flex items-center gap-1 text-sm">
          <Globe className="size-4 text-muted-foreground" />
          PT-BR
        </div>
      </div>
    </>
  );
}
