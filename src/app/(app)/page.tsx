import { getPatientAnalyses } from "@/lib/api/analysis";
import { getPatients } from "@/lib/api/patients";
import { getSession } from "@/lib/api/session";
import type { AnalysisRow } from "@/lib/validation/analysis";

import { patientAlerts } from "./_components/data";
import { PatientsAlert } from "./_components/patients-alert";
import { PerformanceOverview } from "./_components/performance-overview";

export default async function HomePage() {
  const [session, patientsResult] = await Promise.all([getSession(), getPatients()]);

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
    <div className="flex min-h-full flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-medium text-2xl">
          Bem-vindo, <span className="capitalize">{session?.name || "usuário"}</span>!
        </h1>
        <p className="text-muted-foreground text-sm">Acompanhe o desempenho diário dos seus pacientes.</p>
      </div>
      <PatientsAlert alerts={patientAlerts} />
      <PerformanceOverview patients={patients} initialPatientId={initialPatientId} initialAnalyses={initialAnalyses} />
      <footer className="mt-auto flex justify-center border-t pt-4">
        <p className="max-w-2xl text-balance text-center text-muted-foreground text-xs">
          As análises exibidas são estimativas geradas automaticamente e não substituem avaliação clínica. Valide
          sempre os resultados com um profissional de saúde.
        </p>
      </footer>
    </div>
  );
}
