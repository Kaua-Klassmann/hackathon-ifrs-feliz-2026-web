"use client";

import * as React from "react";

import { Monitor, Moon, Sun } from "@/components/icons";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

const themes = ["light", "dark", "system"] as const;

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const themeLabels = {
  light: "claro",
  dark: "escuro",
  system: "sistema",
};

const subscribeNoop = () => () => {};

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const current = mounted ? ((theme as (typeof themes)[number]) ?? "system") : "system";
  const Icon = themeIcons[current];

  function cycleTheme() {
    const nextIndex = (themes.indexOf(current) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={cycleTheme}
      aria-label={`Tema: ${themeLabels[current]}. Clique para alternar.`}
    >
      <Icon />
    </Button>
  );
}
