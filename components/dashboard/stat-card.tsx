import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, detail, icon: Icon, tone = "teal" }: { label: string; value: string; detail: string; icon: LucideIcon; tone?: "teal" | "amber" | "red" | "blue" }) {
  const tones = {
    teal: "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    red: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  };
  return <Card className="min-h-32"><CardContent className="flex h-full items-start gap-4 pt-5"><span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", tones[tone])}><Icon aria-hidden="true" size={18} /></span><div className="min-w-0"><p className="text-xs font-medium uppercase text-muted-foreground">{label}</p><p className="mt-0.5 truncate font-heading text-2xl font-semibold">{value}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{detail}</p></div></CardContent></Card>;
}