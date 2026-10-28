"use client";
"use no memo";

import type { Table as TableType } from "@tanstack/react-table";
import { differenceInYears, parseISO } from "date-fns";

import { UserRound } from "@/components/icons";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { bloodTypeLabels, type PatientRow, type RemedyOption } from "@/lib/validation/patients";

import { PatientRowActions } from "../patient-row-actions";
import { RemediesCell } from "./columns";

export function PatientsMobileList({
  table,
  remedies,
}: {
  readonly table: TableType<PatientRow>;
  readonly remedies: RemedyOption[];
}) {
  const rows = table.getRowModel().rows;

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground text-sm">
        Nenhum paciente encontrado.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => {
        const patient = row.original;

        return (
          <li
            key={row.id}
            data-state={row.getIsSelected() && "selected"}
            className="flex flex-col gap-3 rounded-lg border bg-card p-3 data-[state=selected]:border-ring"
          >
            <div className="flex items-center gap-3">
              <Checkbox
                aria-label={`Selecionar ${patient.name}`}
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
              />
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted">
                <UserRound className="size-4 text-muted-foreground" />
              </span>
              <div className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate font-medium text-sm leading-none">{patient.name}</span>
                <span className="truncate text-muted-foreground text-xs leading-none">
                  #{patient.id.slice(0, 8)}
                </span>
              </div>
              <PatientRowActions patient={patient} remedies={remedies} />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="px-1.5 text-muted-foreground">
                {differenceInYears(new Date(), parseISO(patient.birthdate))} anos
              </Badge>
              <Badge variant="outline" className="px-1.5 text-muted-foreground">
                {patient.is_male ? "Masculino" : "Feminino"}
              </Badge>
              <Badge variant="outline" className="px-1.5 font-medium tabular-nums">
                {bloodTypeLabels[patient.blood_type]}
              </Badge>
            </div>
            <RemediesCell remedies={patient.remedies} />
          </li>
        );
      })}
    </ul>
  );
}
