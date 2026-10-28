"use client";

import { differenceInYears, format, parseISO } from "date-fns";

import { Pill } from "@/components/icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { bloodTypeLabels, type PatientRow } from "@/lib/validation/patients";

export function PatientRemediesSheet({
  patient,
  open,
  onOpenChange,
  onEdit,
}: {
  readonly patient: PatientRow;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onEdit: () => void;
}) {
  const birthdate = parseISO(patient.birthdate);
  const sortedRemedies = [...patient.remedies].sort((a, b) => a.remedy.localeCompare(b.remedy, "pt-BR"));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{patient.name}</SheetTitle>
          <SheetDescription>Medicamentos em uso pelo paciente.</SheetDescription>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Badge variant="outline" className="px-1.5 text-muted-foreground">
              {differenceInYears(new Date(), birthdate)} anos
            </Badge>
            <Badge variant="outline" className="px-1.5 text-muted-foreground">
              {patient.is_male ? "Masculino" : "Feminino"}
            </Badge>
            <Badge variant="outline" className="px-1.5 font-medium tabular-nums">
              {bloodTypeLabels[patient.blood_type]}
            </Badge>
            <Badge variant="outline" className="px-1.5 text-muted-foreground">
              Nasc. {format(birthdate, "dd/MM/yyyy")}
            </Badge>
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          {sortedRemedies.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-center">
              <span className="flex size-10 items-center justify-center rounded-md border bg-muted">
                <Pill className="size-5 text-muted-foreground" />
              </span>
              <p className="text-muted-foreground text-sm">Nenhum medicamento em uso.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {sortedRemedies.map((remedy) => (
                <li key={remedy.id} className="flex items-center gap-3 py-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted">
                    <Pill className="size-4 text-muted-foreground" />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-sm">{remedy.remedy}</span>
                  <span className="shrink-0 text-muted-foreground text-sm tabular-nums">
                    {remedy.quantity} {remedy.quantity === 1 ? "unidade" : "unidades"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={onEdit}>
            Editar medicamentos
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
