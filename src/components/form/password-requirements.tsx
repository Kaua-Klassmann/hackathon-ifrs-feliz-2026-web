import { Check, Circle } from "@/components/icons";

import { cn } from "@/lib/utils";
import { passwordRequirements } from "@/lib/validation/auth";

interface PasswordRequirementsProps {
  readonly id: string;
  readonly value: string;
  readonly showErrors?: boolean;
}

export function PasswordRequirements({ id, value, showErrors = false }: PasswordRequirementsProps) {
  return (
    <ul id={id} className="flex flex-col gap-1">
      {passwordRequirements.map((requirement) => {
        const met = requirement.test(value);

        return (
          <li
            key={requirement.id}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              met && "text-success",
              !met && (showErrors ? "text-destructive" : "text-muted-foreground"),
            )}
          >
            {met ? <Check className="size-3.5 shrink-0" /> : <Circle className="size-3.5 shrink-0" />}
            <span>{requirement.label}</span>
            <span className="sr-only">{met ? "requisito atendido" : "requisito pendente"}</span>
          </li>
        );
      })}
    </ul>
  );
}
