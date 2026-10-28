import { getPatientAnalyses } from "@/lib/api/analysis";
import { getPatients } from "@/lib/api/patients";
import type { AnalysisRow } from "@/lib/validation/analysis";

import { HistoryView } from "./_components/history-view";

export default async function HistoryPage() {
  const patientsResult = await getPatients();
  const patients = patientsResult.ok ? patientsResult.data : [];
  const initialPatientId = patients[0]?.id ?? null;

  let initialAnalyses: AnalysisRow[] = [];
  if (initialPatientId) {
    const analysesResult = await getPatientAnalyses(initialPatientId);
    if (analysesResult.ok) {
      initialAnalyses = analysesResult.data;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-medium text-2xl">Histórico</h1>
        <p className="text-muted-foreground text-sm">Evolução das análises dos seus pacientes.</p>
      </div>
      <HistoryView patients={patients} initialPatientId={initialPatientId} initialAnalyses={initialAnalyses} />
    </div>
  );
}
