"use client";

import { useState, type ComponentProps, type KeyboardEvent } from "react";

import { Eye, EyeOff } from "@/components/icons";

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<ComponentProps<"input">, "type">;

export function PasswordInput({ disabled, onBlur, onKeyDown, onKeyUp, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  function syncCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    setIsCapsLockOn(event.getModifierState("CapsLock"));
  }

  return (
    <>
      <InputGroup data-disabled={disabled || undefined} className={cn(disabled && "opacity-50")}>
        <InputGroupInput
          {...props}
          disabled={disabled}
          type={isVisible ? "text" : "password"}
          onKeyDown={(event) => {
            syncCapsLock(event);
            onKeyDown?.(event);
          }}
          onKeyUp={(event) => {
            syncCapsLock(event);
            onKeyUp?.(event);
          }}
          onBlur={(event) => {
            setIsCapsLockOn(false);
            onBlur?.(event);
          }}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            disabled={disabled}
            aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={isVisible}
            onClick={() => setIsVisible((visible) => !visible)}
          >
            {isVisible ? <EyeOff /> : <Eye />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p aria-live="polite" className="text-muted-foreground text-xs empty:hidden">
        {isCapsLockOn && "Caps Lock está ativado."}
      </p>
    </>
  );
}
