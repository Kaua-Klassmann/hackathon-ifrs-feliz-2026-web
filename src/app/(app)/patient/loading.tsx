import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ROWS = Array.from({ length: 10 }, (_, index) => index);

export default function PatientLoading() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-7 w-80 max-w-full" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-36" />
        </div>

        <div className="flex flex-col rounded-lg border">
          {SKELETON_ROWS.map((row) => (
            <div key={row} className="flex items-center gap-3 border-border/60 border-t px-3 py-4 first:border-t-0">
              <Skeleton className="size-4 shrink-0 rounded-sm" />
              <Skeleton className="size-8 shrink-0 rounded-md" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-3 w-24 max-w-full" />
              </div>
              <Skeleton className="hidden h-4 w-24 shrink-0 md:block" />
              <Skeleton className="hidden h-6 w-12 shrink-0 lg:block" />
              <Skeleton className="hidden h-6 w-48 shrink-0 xl:block" />
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-64" />
        </div>
      </CardContent>
    </Card>
  );
}
