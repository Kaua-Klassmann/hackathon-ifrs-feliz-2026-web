"use client";

import * as React from "react";

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { History } from "@/components/icons";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AnalysisRow } from "@/lib/validation/analysis";
import type { PatientRow } from "@/lib/validation/patients";

import { getPatientAnalysesAction } from "../../actions";
import { analysisMetrics, metricDiff, metricValue } from "../../_components/analysis-metrics";
import { filterByPeriod, periodItems, type PeriodValue } from "../../_components/analysis-period";
import { DiffBadge } from "../../_components/diff-badge";

export function HistoryView({
  patients,
  initialPatientId,
  initialAnalyses,
}: {
  readonly patients: PatientRow[];
  readonly initialPatientId: string | null;
  readonly initialAnalyses: AnalysisRow[];
}) {
  const [patientId, setPatientId] = React.useState(initialPatientId);
  const [period, setPeriod] = React.useState<PeriodValue>("3m");
  const [analyses, setAnalyses] = React.useState(initialAnalyses);
  const [isPending, startTransition] = React.useTransition();

  const patientItems = React.useMemo(
    () => patients.map((patient) => ({ value: patient.id, label: patient.name })),
    [patients],
  );

  function handlePatientChange(nextId: string | null) {
    if (!nextId) return;
    setPatientId(nextId);
    startTransition(async () => {
      const result = await getPatientAnalysesAction(nextId);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setAnalyses(result.data);
    });
  }

  const rows = filterByPeriod(analyses, period).reverse();

  return (
    <Card>
      <CardHeader className="has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="leading-none">Histórico de análises</CardTitle>
        <CardDescription>Resultados de cada teste comparados com o esperado para o perfil do paciente.</CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap items-center justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <Select items={periodItems} value={period} onValueChange={(value) => setPeriod(value as PeriodValue)}>
            <SelectTrigger size="sm" className="w-28">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Período</SelectLabel>
                {periodItems.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select items={patientItems} value={patientId} onValueChange={handlePatientChange}>
            <SelectTrigger size="sm" className="w-44">
              <SelectValue placeholder="Selecione o paciente" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Pacientes</SelectLabel>
                {patientItems.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="relative">
          {patients.length === 0 || rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl border bg-muted">
                <History aria-hidden className="size-6 text-muted-foreground" />
              </span>
              <p className="font-medium text-sm">
                {patients.length === 0 ? "Nenhum paciente cadastrado" : "Nenhuma análise no período"}
              </p>
              <p className="max-w-sm text-muted-foreground text-sm">
                {patients.length === 0
                  ? "Cadastre um paciente para começar a registrar análises."
                  : "Realize um teste na tela de Análises ou amplie o período selecionado."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border bg-card">
              <Table>
                <TableHeader className="bg-muted/15">
                  <TableRow>
                    <TableHead className="h-11 p-3 font-medium">Data</TableHead>
                    {analysisMetrics.map((metric) => (
                      <TableHead key={metric.key} className="h-11 p-3 font-medium">
                        {metric.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((analysis, index) => (
                    <TableRow key={`${analysis.date}-${index}`}>
                      <TableCell className="p-3 align-middle text-sm">
                        {format(parseISO(analysis.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </TableCell>
                      {analysisMetrics.map((metric) => (
                        <TableCell key={metric.key} className="p-3 align-middle">
                          <div className="flex items-center gap-2">
                            <span className="text-sm tabular-nums">
                              {metric.formatValue(metricValue(analysis, metric))}
                            </span>
                            <DiffBadge diff={metricDiff(analysis, metric)} betterWhen={metric.betterWhen} />
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/60">
              <Spinner aria-label="Carregando análises" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
