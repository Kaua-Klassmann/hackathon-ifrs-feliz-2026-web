import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ROWS = Array.from({ length: 10 }, (_, index) => index);

export default function UsersLoading() {
  return (
    <Card>
      <CardHeader className="border-b">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        <div className="flex flex-wrap items-center gap-3 px-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-32" />
        </div>

        <div className="flex flex-col">
          {SKELETON_ROWS.map((row) => (
            <div key={row} className="flex items-center gap-3 border-border/60 border-t px-4 py-4">
              <Skeleton className="size-4 shrink-0 rounded-sm" />
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-4 w-56 max-w-full" />
              </div>
              <Skeleton className="hidden h-6 w-28 shrink-0 md:block" />
              <Skeleton className="hidden h-6 w-24 shrink-0 lg:block" />
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between px-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-40" />
        </div>
      </CardContent>
    </Card>
  );
}
