import { getPatients } from "@/lib/api/patients";

import { AnalysisFlow } from "./_components/analysis-flow";

export default async function AnalysisPage() {
  const patientsResult = await getPatients();
  const patients = patientsResult.ok ? patientsResult.data : [];

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="shrink-0 space-y-1">
        <h1 className="font-medium text-2xl">Análises</h1>
        <p className="text-muted-foreground text-sm">
          Aplique o teste TUG (Timed Up and Go) com análise de movimento pela câmera.
        </p>
      </div>
      <AnalysisFlow patients={patients} />
    </div>
  );
}
