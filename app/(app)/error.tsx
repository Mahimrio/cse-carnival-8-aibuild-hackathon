"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="grid min-h-80 place-items-center rounded-card border border-dashed bg-card p-6 text-center"><div><span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/30"><AlertTriangle aria-hidden="true" /></span><h1 className="font-heading text-lg font-semibold">Campus data could not be loaded</h1><p className="mt-1 text-sm text-muted-foreground">Check the connection and try again.</p><Button className="mt-5" onClick={reset}><RotateCcw aria-hidden="true" size={15} />Try again</Button></div></div>;
}