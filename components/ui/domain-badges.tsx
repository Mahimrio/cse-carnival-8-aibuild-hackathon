import { Badge } from "@/components/ui/badge";
import { roleColor, roleName } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const colors = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  };
  return <Badge className={colors[priority]}>{priority}</Badge>;
}

export function EquipmentPill({ children }: { children: React.ReactNode }) {
  return <Badge variant="outline" className="border-zinc-300 text-muted-foreground dark:border-zinc-700">{children}</Badge>;
}

export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge className={roleColor(role)}>{roleName(role)}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const positive = ["active", "available", "submitted", "graded"].includes(status);
  const negative = ["rejected", "unavailable", "cancelled", "late"].includes(status);
  return <Badge className={cn(positive && "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", negative && "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", !positive && !negative && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300")}>{status}</Badge>;
}