"use client";

import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useState } from "react";
import { PriorityBadge } from "@/components/ui/domain-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import type { Announcement } from "@/lib/types";
import { cn } from "@/lib/utils";

const border = { high: "border-l-red-500", medium: "border-l-amber-400", low: "border-l-zinc-300 dark:border-l-zinc-600" };
const icons = { high: AlertTriangle, medium: AlertCircle, low: Info };

export function AnnouncementsView({ announcements }: { announcements: Announcement[] }) {
  const [filter, setFilter] = useState<"all" | Announcement["priority"]>("all");
  const filtered = announcements.filter((item) => filter === "all" || item.priority === filter).sort((a, b) => b.date.localeCompare(a.date));
  return <div><SectionHeader title="Announcements" description={`${announcements.filter((item) => item.priority === "high").length} high priority`} className="mb-4" /><div className="mb-4 flex gap-2 overflow-x-auto pb-1">{(["all", "high", "medium", "low"] as const).map((value) => <button type="button" key={value} onClick={() => setFilter(value)} className={cn("rounded-lg bg-muted px-3 py-1.5 text-xs font-medium capitalize text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700", filter === value && "bg-primary text-primary-foreground hover:bg-primary dark:hover:bg-primary")}>{value}</button>)}</div>{filtered.length === 0 ? <EmptyState title="No announcements" description="Nothing matches this priority filter." /> : <div className="flex flex-col gap-3">{filtered.map((item) => { const Icon = icons[item.priority]; return <article key={item.id} className={`rounded-card border border-l-4 bg-card px-4 py-4 shadow-sm ${border[item.priority]}`}><div className="flex items-start gap-2"><Icon aria-hidden="true" size={14} className={cn("mt-0.5 shrink-0", item.priority === "high" && "text-red-600", item.priority === "medium" && "text-amber-500", item.priority === "low" && "text-zinc-400")} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-heading text-sm font-semibold">{item.title}</h3><PriorityBadge priority={item.priority} /></div><p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p><p className="mt-2 text-xs text-muted-foreground">By {item.posted_by} · {item.date} · Expires {item.expires}</p></div></div></article>; })}</div>}</div>;
}