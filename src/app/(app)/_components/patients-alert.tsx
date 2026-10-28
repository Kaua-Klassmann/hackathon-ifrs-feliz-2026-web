import Link from "next/link";

import { TriangleAlert } from "@/components/icons";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export type PatientAlert = {
  readonly id: string;
  readonly name: string;
  readonly reason: string;
};

const listFormat = new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" });

function alertContent(alerts: PatientAlert[]) {
  if (alerts.length === 1) {
    return {
      title: `${alerts[0].name} está em alerta`,
      description: alerts[0].reason,
    };
  }

  const names = alerts.map((alert) => alert.name);
  const visible = names.slice(0, 2);
  const remaining = names.length - visible.length;
  const formatted = listFormat.format(remaining > 0 ? [...visible, `mais ${remaining}`] : visible);

  return {
    title: `${alerts.length} pacientes em alerta`,
    description: `${formatted} precisam de atenção.`,
  };
}

export function PatientsAlert({ alerts }: { readonly alerts: PatientAlert[] }) {
  if (alerts.length === 0) {
    return null;
  }

  const { title, description } = alertContent(alerts);

  return (
    <Alert className="grid-cols-[auto_1fr] items-center gap-x-3 rounded-3xl px-4 py-4 shadow-md ring-1 ring-foreground/5 has-data-[slot=alert-action]:pr-4 sm:has-data-[slot=alert-action]:pr-36 dark:ring-foreground/10">
      <span className="row-span-2 flex size-10 items-center justify-center rounded-xl bg-warning/10 dark:bg-warning/20">
        <TriangleAlert aria-hidden className="size-5 text-warning" />
      </span>
      <AlertTitle className="truncate">{title}</AlertTitle>
      <AlertDescription className="truncate">{description}</AlertDescription>
      <AlertAction className="top-1/2 right-4 -translate-y-1/2 max-sm:static max-sm:col-span-2 max-sm:mt-3 max-sm:translate-y-0">
        <Button size="sm" nativeButton={false} render={<Link href="/history" />}>
          Ver histórico
        </Button>
      </AlertAction>
    </Alert>
  );
}
