import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/** Ação única de saída: ou navega, ou tenta de novo. Nunca as duas. */
type StatusAction =
  | { readonly label: string; readonly href: string }
  | {
      readonly label: string;
      readonly onRetry: () => void;
      /** Rótulo no gerúndio enquanto a tentativa está em voo. */
      readonly pendingLabel: string;
      readonly isPending: boolean;
    };

interface StatusScreenProps {
  /** Título curto e conclusivo. Termina com ponto. */
  readonly title: string;
  /** Uma frase explicando o que aconteceu, em linguagem de usuário. */
  readonly description: string;
  /** Toda tela de status precisa oferecer exatamente um caminho de saída. */
  readonly action: StatusAction;
}

/**
 * Tela de status de página inteira: 404, 403, 401 e erros de render.
 *
 * Existe para que `not-found`, `forbidden`, `unauthorized` e `error` não sejam
 * quatro cópias da mesma estrutura — as três primeiras eram, e divergiam no
 * tratamento do título.
 */
export function StatusScreen({ title, description, action }: StatusScreenProps) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="font-medium text-2xl">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
      {"href" in action ? (
        <Button
          className="mt-2"
          nativeButton={false}
          render={<Link prefetch={false} replace href={action.href} />}
        >
          {action.label}
        </Button>
      ) : (
        <Button className="mt-2" disabled={action.isPending} onClick={action.onRetry}>
          {action.isPending && <Spinner aria-hidden />}
          {action.isPending ? action.pendingLabel : action.label}
        </Button>
      )}
    </div>
  );
}
