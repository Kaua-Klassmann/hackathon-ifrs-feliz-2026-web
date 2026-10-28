"use client";

import { Download } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PatientRow, RemedyOption } from "@/lib/validation/patients";

import { NewPatientDialog } from "./new-patient-dialog";
import { RecentPatientsTable } from "./recent-patients-table/table";

export function PatientsOverview({
  patients,
  remedies,
}: {
  patients: PatientRow[];
  remedies: RemedyOption[];
}) {
  return (
    <Card>
      <CardHeader className="has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="leading-none">
          {patients.length} {patients.length === 1 ? "Paciente" : "Pacientes"}
        </CardTitle>
        <CardDescription>
          Pacientes cadastrados com idade, sexo, tipo sanguíneo e medicamentos em uso.
        </CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap items-center justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <Button variant="outline" size="sm" disabled>
            <Download />
            Exportar
          </Button>
          <NewPatientDialog remedies={remedies} />
        </CardAction>
      </CardHeader>

      <CardContent className="pt-0">
        <RecentPatientsTable data={patients} remedies={remedies} />
      </CardContent>
    </Card>
  );
}
