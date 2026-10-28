"use client";

import * as React from "react";

import { toast } from "sonner";

import { MoreHorizontal } from "@/components/icons";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PatientRow, RemedyOption } from "@/lib/validation/patients";

import { deletePatientAction } from "../actions";
import { EditRemediesDialog } from "./edit-remedies-dialog";
import { PatientRemediesSheet } from "./patient-remedies-sheet";

export function PatientRowActions({
  patient,
  remedies,
}: {
  readonly patient: PatientRow;
  readonly remedies: RemedyOption[];
}) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  function handleEditFromSheet() {
    setViewOpen(false);
    setEditOpen(true);
  }

  async function handleConfirm() {
    setIsPending(true);
    const result = await deletePatientAction(patient.id);
    setIsPending(false);

    if (result.ok) {
      toast.success(`${patient.name} foi excluído.`);
      setConfirmOpen(false);
      return;
    }

    toast.error(result.error.message);
  }

  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label={`Abrir ações de ${patient.name}`}
              className="text-muted-foreground"
              size="icon-sm"
              variant="ghost"
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setViewOpen(true)}>Ver medicamentos</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>Editar medicamentos</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
            Excluir paciente
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PatientRemediesSheet patient={patient} open={viewOpen} onOpenChange={setViewOpen} onEdit={handleEditFromSheet} />
      <EditRemediesDialog patient={patient} remedies={remedies} open={editOpen} onOpenChange={setEditOpen} />

      <AlertDialog open={confirmOpen} onOpenChange={(next) => !isPending && setConfirmOpen(next)}>
        <AlertDialogContent className="text-left">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {patient.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              O paciente e seus medicamentos deixam de aparecer na lista. Esta ação não pode ser desfeita por aqui.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={isPending} onClick={handleConfirm}>
              {isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
