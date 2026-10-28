"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      scriptProps={{ type: typeof window === "undefined" ? "text/javascript" : "text/plain" }}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
