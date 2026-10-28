"use client";

import * as React from "react";

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Area, CartesianGrid, ComposedChart, Line, XAxis } from "recharts";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
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
import { type AnalysisRow, expectedValue } from "@/lib/validation/analysis";
import type { PatientRow } from "@/lib/validation/patients";

import { getPatientAnalysesAction } from "../actions";
import {
  type AnalysisMetricKey,
  analysisMetricItems,
  getAnalysisMetric,
  metricDiff,
  metricValue,
} from "./analysis-metrics";
import { filterByPeriod, periodItems, type PeriodValue } from "./analysis-period";

const chartConfig = {
  medida: {
    label: "Medido",
    color: "var(--chart-1)",
  },
  esperada: {
    label: "Esperado",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function PerformanceOverview({
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
  const [metricKey, setMetricKey] = React.useState<AnalysisMetricKey>("velocity");
  const [analyses, setAnalyses] = React.useState(initialAnalyses);
  const [isPending, startTransition] = React.useTransition();
  const metric = getAnalysisMetric(metricKey);

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

  const filtered = filterByPeriod(analyses, period);
  const chartData = filtered.map((analysis) => {
    const value = metricValue(analysis, metric);
    return {
      date: analysis.date,
      medida: value,
      esperada: expectedValue(value, metricDiff(analysis, metric)),
    };
  });

  return (
    <Card className="@container/card">
      <CardHeader className="has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="leading-none">Evolução das análises</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            {metric.label} medido vs esperado para o perfil do paciente
          </span>
          <span className="@[540px]/card:hidden">Medido vs esperado</span>
        </CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap items-center justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <Select
            items={analysisMetricItems}
            value={metricKey}
            onValueChange={(value) => setMetricKey(value as AnalysisMetricKey)}
          >
            <SelectTrigger size="sm" className="w-32">
              <SelectValue placeholder="Métrica" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Métrica</SelectLabel>
                {analysisMetricItems.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

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

          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/history" />}>
            Ver histórico
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="relative">
          {patients.length === 0 ? (
            <div className="flex h-64 items-center justify-center @[540px]/card:h-80">
              <p className="text-muted-foreground text-sm">Cadastre um paciente para acompanhar as análises.</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-64 items-center justify-center @[540px]/card:h-80">
              <p className="text-muted-foreground text-sm">Nenhuma análise no período selecionado.</p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full @[540px]/card:h-80">
              <ComposedChart data={chartData} margin={{ top: 0 }}>
                <defs>
                  <linearGradient id="fillMedida" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-medida)" stopOpacity={0.36} />
                    <stop offset="95%" stopColor="var(--color-medida)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeOpacity={0.5} />

                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={48}
                  tickFormatter={(value) => format(parseISO(value), "d MMM", { locale: ptBR })}
                />

                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      className="w-56"
                      indicator="line"
                      labelFormatter={(value) => format(parseISO(value), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    />
                  }
                />
                <ChartLegend verticalAlign="top" content={<ChartLegendContent className="mb-5 flex-wrap justify-end" />} />

                <Area
                  dataKey="medida"
                  type="natural"
                  fill="url(#fillMedida)"
                  stroke="var(--color-medida)"
                  strokeWidth={1.5}
                  dot={{ r: 3 }}
                  fillOpacity={1}
                />
                <Line dataKey="esperada" type="natural" stroke="var(--color-esperada)" strokeWidth={1.4} dot={false} />
              </ComposedChart>
            </ChartContainer>
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
