import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPatients, getRemedies } from "@/lib/api/patients";

import { PatientsOverview } from "./_components/patients-overview";

export default async function PatientPage() {
  const [result, remediesResult] = await Promise.all([getPatients(), getRemedies()]);

  if (!result.ok) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="leading-none">Pacientes</CardTitle>
          <CardDescription>Não foi possível carregar a lista de pacientes.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-start gap-3">
            <p className="text-muted-foreground text-sm">{result.error.message}</p>
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/patient" />}>
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <PatientsOverview patients={result.data} remedies={remediesResult.ok ? remediesResult.data : []} />;
}
