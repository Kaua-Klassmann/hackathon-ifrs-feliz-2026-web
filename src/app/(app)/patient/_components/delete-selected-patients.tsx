"use client";

import * as React from "react";

import { toast } from "sonner";

import { Trash2 } from "@/components/icons";

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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { PatientRow } from "@/lib/validation/patients";

import { deletePatientAction } from "../actions";

const CONFIRMATION_WORD = "Excluir";

export function DeleteSelectedPatients({
  patients,
  onDeleted,
}: {
  readonly patients: PatientRow[];
  readonly onDeleted: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);

  const isBulk = patients.length > 1;
  const confirmationMatches = confirmation.trim().toLowerCase() === CONFIRMATION_WORD.toLowerCase();
  const canConfirm = !isPending && (!isBulk || confirmationMatches);

  if (patients.length === 0) {
    return null;
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) {
      return;
    }
    setConfirmOpen(nextOpen);
    if (!nextOpen) {
      setConfirmation("");
    }
  }

  async function handleConfirm() {
    setIsPending(true);
    const results = await Promise.all(patients.map((patient) => deletePatientAction(patient.id)));
    setIsPending(false);

    const failures = results.filter((result) => !result.ok).length;
    const deleted = results.length - failures;

    if (failures === 0) {
      toast.success(deleted === 1 ? `${patients[0].name} foi excluído.` : `${deleted} pacientes foram excluídos.`);
    } else if (deleted > 0) {
      toast.warning(`${deleted} paciente(s) excluído(s); ${failures} falharam. Tente novamente.`);
    } else {
      toast.error("Não foi possível excluir. Tente novamente.");
    }

    setConfirmOpen(false);
    setConfirmation("");
    onDeleted();
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
        <Trash2 />
        Excluir ({patients.length})
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent className="text-left">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isBulk ? `Excluir ${patients.length} pacientes?` : `Excluir ${patients[0].name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isBulk
                ? `Os ${patients.length} pacientes selecionados e seus medicamentos deixam de aparecer na lista. Esta ação não pode ser desfeita por aqui.`
                : "O paciente e seus medicamentos deixam de aparecer na lista. Esta ação não pode ser desfeita por aqui."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isBulk && (
            <Field className="gap-1.5">
              <FieldLabel htmlFor="delete-patients-confirmation">
                Digite &ldquo;{CONFIRMATION_WORD}&rdquo; para confirmar
              </FieldLabel>
              <Input
                id="delete-patients-confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder={CONFIRMATION_WORD}
                autoComplete="off"
                disabled={isPending}
              />
            </Field>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={!canConfirm} onClick={handleConfirm}>
              {isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
