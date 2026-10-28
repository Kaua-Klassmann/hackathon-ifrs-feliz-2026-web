"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { differenceInYears, format, parseISO } from "date-fns";

import { Pill, UserRound } from "@/components/icons";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { bloodTypeLabels, type PatientRow, type RemedyOption } from "@/lib/validation/patients";

import { PatientRowActions } from "../patient-row-actions";

const MAX_VISIBLE_REMEDIES = 2;

export function RemediesCell({ remedies }: { remedies: PatientRow["remedies"] }) {
  if (remedies.length === 0) {
    return <span className="text-muted-foreground text-sm">Nenhum</span>;
  }

  const visible = remedies.slice(0, MAX_VISIBLE_REMEDIES);
  const hiddenCount = remedies.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((remedy) => (
        <Badge key={remedy.id} variant="outline" className="px-1.5 text-muted-foreground">
          <Pill />
          {remedy.remedy}
          {remedy.quantity > 1 ? ` ×${remedy.quantity}` : ""}
        </Badge>
      ))}
      {hiddenCount > 0 ? (
        <Tooltip>
          <TooltipTrigger
            render={<Badge variant="outline" className="px-1.5 text-muted-foreground" tabIndex={0} />}
          >
            +{hiddenCount}
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-0.5">
              {remedies.slice(MAX_VISIBLE_REMEDIES).map((remedy) => (
                <span key={remedy.id}>
                  {remedy.remedy}
                  {remedy.quantity > 1 ? ` ×${remedy.quantity}` : ""}
                </span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}

export function createRecentPatientsColumns({
  remedies,
}: {
  remedies: RemedyOption[];
}): ColumnDef<PatientRow>[] {
  return [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label="Selecionar todos os pacientes desta página"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label={`Selecionar ${row.original.name}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Paciente",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-md border bg-muted">
          <UserRound className="size-4 text-muted-foreground" />
        </span>
        <div className="grid min-w-0 gap-0.5">
          <span className="truncate font-medium text-sm leading-none">{row.original.name}</span>
          <span className="truncate text-muted-foreground text-xs leading-none">
            #{row.original.id.slice(0, 8)}
          </span>
        </div>
      </div>
    ),
    enableHiding: false,
  },
  {
    id: "search",
    accessorFn: (row) => `${row.name} ${row.remedies.map((remedy) => remedy.remedy).join(" ")}`,
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    accessorKey: "birthdate",
    header: "Idade",
    cell: ({ row }) => {
      const birthdate = parseISO(row.original.birthdate);

      return (
        <div className="grid gap-0.5">
          <span className="text-sm">{differenceInYears(new Date(), birthdate)} anos</span>
          <span className="text-muted-foreground text-xs">{format(birthdate, "dd/MM/yyyy")}</span>
        </div>
      );
    },
  },
  {
    id: "sex",
    accessorFn: (row) => (row.is_male ? "Masculino" : "Feminino"),
    header: "Sexo",
    filterFn: "equalsString",
    cell: ({ row }) => <span className="text-sm">{row.original.is_male ? "Masculino" : "Feminino"}</span>,
  },
  {
    id: "bloodType",
    accessorFn: (row) => bloodTypeLabels[row.blood_type],
    header: "Tipo sanguíneo",
    filterFn: "equalsString",
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 font-medium tabular-nums">
        {bloodTypeLabels[row.original.blood_type]}
      </Badge>
    ),
  },
  {
    id: "remedies",
    header: "Medicamentos",
    cell: ({ row }) => <RemediesCell remedies={row.original.remedies} />,
    enableSorting: false,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Ações</div>,
    cell: ({ row }) => <PatientRowActions patient={row.original} remedies={remedies} />,
    enableHiding: false,
    enableSorting: false,
  },
  ];
}
