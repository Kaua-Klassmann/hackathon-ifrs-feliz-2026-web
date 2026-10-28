"use client";

import * as React from "react";

import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import { ChevronDown, X } from "@/components/icons";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type {
  PatientRemedyInput,
  RemedyOption,
} from "@/lib/validation/patients";

type RemediesFormValues = { remedies: PatientRemedyInput[] };

export function RemediesFields({
  remedies,
  disabled,
}: {
  readonly remedies: RemedyOption[];
  readonly disabled: boolean;
}) {
  const form = useFormContext<RemediesFormValues>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "remedies",
  });
  const hasCatalog = remedies.length > 0;

  const namesById = React.useMemo(
    () => new Map(remedies.map((option) => [option.id, option.name])),
    [remedies],
  );
  const selectedIds = new Set(fields.map((fieldItem) => fieldItem.remedy));

  function toggleRemedy(remedyId: string, checked: boolean) {
    if (checked) {
      append({ remedy: remedyId, quantity: 1 });
      return;
    }
    const index = fields.findIndex(
      (fieldItem) => fieldItem.remedy === remedyId,
    );
    if (index >= 0) {
      remove(index);
    }
  }

  return (
    <Field className="gap-1.5">
      <FieldLabel>Medicamentos</FieldLabel>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between"
              disabled={disabled || !hasCatalog}
            />
          }
        >
          <span className="flex items-center gap-2">
            {fields.length === 0
              ? "Selecionar medicamentos"
              : `${fields.length} ${fields.length === 1 ? "medicamento selecionado" : "medicamentos selecionados"}`}
          </span>
          <ChevronDown className="text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {remedies.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.id}
              checked={selectedIds.has(option.id)}
              onCheckedChange={(checked) => toggleRemedy(option.id, checked)}
              closeOnClick={false}
            >
              {option.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {!hasCatalog && (
        <p className="text-muted-foreground text-xs">
          Não foi possível carregar o catálogo de medicamentos.
        </p>
      )}
      {fields.length > 0 && (
        <div className="flex flex-col gap-2 pt-1">
          {fields.map((fieldItem, index) => (
            <div key={fieldItem.id} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm">
                {namesById.get(fieldItem.remedy) ?? "Medicamento"}
              </span>
      <Controller
        control={form.control}
        name={`remedies.${index}.quantity`}
        render={({ field, fieldState }) => (
          <Field
            className="w-20 gap-1.5"
            data-invalid={fieldState.invalid}
          >
            <Input
              {...field}
              type="number"
              min={0}
              aria-label={`Quantidade de ${
                namesById.get(fieldItem.remedy) ?? "medicamento"
              }`}
              aria-invalid={fieldState.invalid}
              onChange={(event) =>
                field.onChange(event.target.valueAsNumber)
              }
            />

            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
            )}

            <p>{field.value === 1 ? "Unidade" : "Unidades"}</p>
          </Field>
        )}
      />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
                aria-label={`Remover ${namesById.get(fieldItem.remedy) ?? "medicamento"}`}
                disabled={disabled}
                onClick={() => remove(index)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Field>
  );
}
