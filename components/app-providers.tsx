"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";

function AppToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster closeButton richColors position="bottom-right" theme={resolvedTheme === "dark" ? "dark" : "light"} />;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <AppToaster />
    </ThemeProvider>
  );
}