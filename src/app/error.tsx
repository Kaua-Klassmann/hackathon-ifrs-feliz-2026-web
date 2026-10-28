"use client";

import { useEffect, useTransition } from "react";

import { StatusScreen } from "@/components/status-screen";

/**
 * Fronteira de erro da aplicação.
 *
 * Sem este arquivo, uma exceção de render mostra a tela padrão do Next — que
 * está em inglês e não segue nenhum token do design system.
 */
export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    console.error("[app] render_error", { digest: error.digest, error });
  }, [error]);

  return (
    <StatusScreen
      title="Algo deu errado."
      description="Não foi possível carregar esta página. Tente novamente em instantes."
      action={{
        label: "Tentar novamente",
        pendingLabel: "Tentando novamente...",
        isPending,
        onRetry: () => startTransition(() => unstable_retry()),
      }}
    />
  );
}
