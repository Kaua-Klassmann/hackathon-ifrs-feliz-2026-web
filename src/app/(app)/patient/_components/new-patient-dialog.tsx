"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Plus } from "@/components/icons";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  bloodTypeOptions,
  bloodTypeSchema,
  createPatientSchema,
  patientRemediesInputSchema,
  type RemedyOption,
} from "@/lib/validation/patients";

import { createPatientAction } from "../actions";
import { RemediesFields } from "./remedies-fields";

const formSchema = z.object({
  name: createPatientSchema.shape.name,
  birthdate: createPatientSchema.shape.birthdate,
  sex: z.enum(["male", "female"], "Selecione o sexo."),
  blood_type: z.enum(bloodTypeSchema.options, "Selecione o tipo sanguíneo."),
  remedies: patientRemediesInputSchema,
});

const sexItems = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Feminino" },
];

const bloodTypeItems = bloodTypeOptions.map((option) => ({ value: option.value, label: option.label }));

export function NewPatientDialog({ remedies }: { readonly remedies: RemedyOption[] }) {
  const [open, setOpen] = React.useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      birthdate: "",
      remedies: [],
    },
  });
  const isPending = form.formState.isSubmitting;

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) {
      return;
    }
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset();
    }
  }

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const result = await createPatientAction({
      name: data.name,
      birthdate: data.birthdate,
      is_male: data.sex === "male",
      blood_type: data.blood_type,
      remedies: data.remedies,
    });

    if (result.ok) {
      toast.success(`${data.name} foi cadastrado.`);
      setOpen(false);
      form.reset();
      return;
    }

    toast.error(result.error.message);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus />
        Novo paciente
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo paciente</DialogTitle>
          <DialogDescription>Informe os dados do paciente para cadastrá-lo.</DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FieldSet className="min-w-0" disabled={isPending}>
              <FieldGroup className="gap-4">
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="new-patient-name">Nome</FieldLabel>
                      <Input
                        {...field}
                        id="new-patient-name"
                        placeholder="Nome completo"
                        autoComplete="off"
                        autoFocus
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="birthdate"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="new-patient-birthdate">Data de nascimento</FieldLabel>
                      <Input {...field} id="new-patient-birthdate" type="date" aria-invalid={fieldState.invalid} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    control={form.control}
                    name="sex"
                    render={({ field, fieldState }) => (
                      <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="new-patient-sex">Sexo</FieldLabel>
                        <Select items={sexItems} value={field.value ?? null} onValueChange={field.onChange}>
                          <SelectTrigger id="new-patient-sex" aria-invalid={fieldState.invalid}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {sexItems.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="blood_type"
                    render={({ field, fieldState }) => (
                      <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="new-patient-blood-type">Tipo sanguíneo</FieldLabel>
                        <Select items={bloodTypeItems} value={field.value ?? null} onValueChange={field.onChange}>
                          <SelectTrigger id="new-patient-blood-type" aria-invalid={fieldState.invalid}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {bloodTypeItems.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>
                <RemediesFields remedies={remedies} disabled={isPending} />
              </FieldGroup>
            </FieldSet>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={isPending} onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner aria-hidden />}
                {isPending ? "Cadastrando..." : "Cadastrar paciente"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
