"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldSet } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import {
  patientRemediesInputSchema,
  type PatientRow,
  type RemedyOption,
} from "@/lib/validation/patients";

import { updatePatientRemediesAction } from "../actions";
import { RemediesFields } from "./remedies-fields";

const formSchema = z.object({
  remedies: patientRemediesInputSchema,
});

function toFormRemedies(patient: PatientRow, remedies: RemedyOption[]) {
  return patient.remedies.flatMap((entry) => {
    const option = remedies.find((candidate) => candidate.name === entry.remedy);
    return option ? [{ remedy: option.id, quantity: entry.quantity }] : [];
  });
}

export function EditRemediesDialog({
  patient,
  remedies,
  open,
  onOpenChange,
}: {
  readonly patient: PatientRow;
  readonly remedies: RemedyOption[];
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { remedies: toFormRemedies(patient, remedies) },
  });
  const isPending = form.formState.isSubmitting;

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) {
      return;
    }
    onOpenChange(nextOpen);
    if (!nextOpen) {
      form.reset({ remedies: toFormRemedies(patient, remedies) });
    }
  }

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const result = await updatePatientRemediesAction(patient.id, data.remedies);

    if (result.ok) {
      toast.success(`Medicamentos de ${patient.name} atualizados.`);
      onOpenChange(false);
      return;
    }

    toast.error(result.error.message);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Medicamentos de {patient.name}</DialogTitle>
          <DialogDescription>Adicione, remova ou ajuste as quantidades dos medicamentos em uso.</DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FieldSet className="min-w-0" disabled={isPending}>
              <RemediesFields remedies={remedies} disabled={isPending} />
            </FieldSet>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={isPending} onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner aria-hidden />}
                {isPending ? "Salvando..." : "Salvar medicamentos"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
