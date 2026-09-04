"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mx-auto max-w-md space-y-5 rounded-xl border border-destructive/20 bg-card p-6 shadow-card">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/40">
          <AlertTriangle size={24} aria-hidden="true" />
        </span>
        <div className="space-y-1.5">
          <h1 className="font-heading text-xl font-bold tracking-tight">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred while running the application.
          </p>
        </div>
        <Button onClick={reset} className="gap-2">
          <RotateCcw size={15} aria-hidden="true" />
          Reload Application
        </Button>
      </div>
    </div>
  );
}
