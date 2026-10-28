import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function DiffBadge({
  diff,
  betterWhen,
}: {
  readonly diff: number | null;
  readonly betterWhen: "higher" | "lower";
}) {
  if (diff === null) {
    return null;
  }

  const isBetter = betterWhen === "higher" ? diff >= 0 : diff <= 0;
  const formatted = `${diff > 0 ? "+" : ""}${diff.toFixed(0)}%`;

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-1.5 tabular-nums",
        isBetter ? "border-success/40 text-success" : "border-warning/40 text-warning",
      )}
    >
      {formatted}
    </Badge>
  );
}
