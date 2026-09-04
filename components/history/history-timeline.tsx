"use client";

import { formatDistanceToNow } from "date-fns";
import { Clock, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { auditActionColor, entityLabels, formatAuditAction } from "@/lib/audit-format";
import { roleColor, roleName } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";
import type { AuditLog, EntityType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function HistoryTimeline({ entries }: { entries: AuditLog[] }) {
  const router = useRouter();
  const firstId = useRef(entries[0]?.id);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [entity, setEntity] = useState<"all" | EntityType>("all");
  const [action, setAction] = useState("all");

  useEffect(() => {
    if (entries[0]?.id && firstId.current && entries[0].id !== firstId.current) {
      setHighlighted(entries[0].id);
      const timer = setTimeout(() => setHighlighted(null), 2200);
      firstId.current = entries[0].id;
      return () => clearTimeout(timer);
    }
    firstId.current = entries[0]?.id;
  }, [entries]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("audit-history").on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_log" }, () => router.refresh()).subscribe();
    const fallback = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 10_000);
    return () => { clearInterval(fallback); void supabase.removeChannel(channel); };
  }, [router]);

  const filtered = entries.filter((entry) => entity === "all" || entry.entity_type === entity).filter((entry) => action === "all" || entry.action === action);
  const actions = [...new Set(entries.map((entry) => entry.action))].sort();

  return <div><div className="mb-6 flex flex-wrap items-center gap-3"><Filter aria-hidden="true" size={15} className="text-muted-foreground" /><Select value={entity} onChange={(event) => setEntity(event.target.value as "all" | EntityType)} className="w-44"><option value="all">All Types</option>{Object.entries(entityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Select value={action} onChange={(event) => setAction(event.target.value)} className="w-44"><option value="all">All Actions</option>{actions.map((value) => <option key={value} value={value}>{formatAuditAction(value)}</option>)}</Select>{(entity !== "all" || action !== "all") && <button type="button" onClick={() => { setEntity("all"); setAction("all"); }} className="text-xs font-medium text-primary hover:underline">Clear filters</button>}<span className="ml-auto text-xs text-muted-foreground">{filtered.length} results</span></div>{filtered.length === 0 ? <EmptyState title={entries.length ? "No matching activity" : "No audit entries yet"} description={entries.length ? "Try clearing one of the filters." : "Campus changes will appear here as they happen."} icon={<Clock size={22} />} /> : <div className="relative"><div className="absolute bottom-0 left-2.5 top-0 w-px bg-border" /><div>{filtered.map((entry) => { const created = new Date(entry.created_at); return <article key={entry.id} className="relative flex gap-4 pb-5"><span className={cn("z-10 mt-3 size-5 shrink-0 rounded-full border-4 border-zinc-50 bg-zinc-400 dark:border-zinc-950", ["create", "approve", "register"].includes(entry.action) && "bg-green-500", ["delete", "reject"].includes(entry.action) && "bg-red-500", ["book", "smart_entry_accept"].includes(entry.action) && "bg-teal-500")} /><div className={cn("min-w-0 flex-1 rounded-card border bg-card px-4 py-3 shadow-sm transition-colors duration-500", highlighted === entry.id && "border-primary/40 bg-teal-50 dark:bg-teal-950/20")}><div className="flex items-start gap-3"><Avatar name={entry.actor_label} size="sm" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium">{entry.actor_label}</span><Badge className={roleColor(entry.actor_role)}>{roleName(entry.actor_role)}</Badge><Badge className={auditActionColor(entry.action)}>{formatAuditAction(entry.action)}</Badge><Badge>{entityLabels[entry.entity_type] ?? entry.entity_type}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{entry.summary}</p><p className="mt-1.5 text-xs text-muted-foreground"><span title={created.toISOString()}>{formatDistanceToNow(created, { addSuffix: true })}</span> · {created.toLocaleString()}</p></div></div></div></article>; })}</div></div>}</div>;
}