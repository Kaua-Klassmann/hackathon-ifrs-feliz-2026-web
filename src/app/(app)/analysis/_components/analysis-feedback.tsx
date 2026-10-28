"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalysisDiffs, CreateAnalysisInput } from "@/lib/validation/analysis";

import { analysisMetrics } from "../../_components/analysis-metrics";
import { DiffBadge } from "../../_components/diff-badge";

export function AnalysisFeedback({
  input,
  diffs,
}: {
  readonly input: CreateAnalysisInput;
  readonly diffs: AnalysisDiffs;
}) {
  return (
    <Card className="mx-auto w-full max-w-md" size="sm">
      <CardHeader>
        <CardTitle className="leading-none">Comparação com o esperado</CardTitle>
        <CardDescription>Diferença em relação ao perfil de referência do paciente.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {analysisMetrics.map((metric) => (
          <div key={metric.key} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">{metric.label}</span>
            <span className="flex items-center gap-2">
              <span className="font-medium tabular-nums">{metric.formatValue(input[metric.key])}</span>
              <DiffBadge diff={diffs[metric.diffKey]} betterWhen={metric.betterWhen} />
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
