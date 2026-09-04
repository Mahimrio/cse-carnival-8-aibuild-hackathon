"use client";

import { AlertCircle, AlertTriangle, Info, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ManagerOnly } from "@/components/auth/manager-only";
import { EntityFormDialog, type EntityField } from "@/components/systems/entity-form-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { PriorityBadge } from "@/components/ui/domain-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { useServerAction } from "@/hooks/use-server-action";
import { createAnnouncement, deleteAnnouncement, updateAnnouncement } from "@/lib/actions/announcements";
import type { Announcement, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

const border = { high: "border-l-red-500", medium: "border-l-amber-400", low: "border-l-zinc-300 dark:border-l-zinc-600" };
const icons = { high: AlertTriangle, medium: AlertCircle, low: Info };
const fields: EntityField[] = [
  { name: "title", label: "Title", required: true, full: true },
  { name: "body", label: "Body", type: "textarea", required: true, full: true },
  { name: "priority", label: "Priority", type: "select", options: ["high", "medium", "low"].map((value) => ({ value, label: value })) },
  { name: "posted_by", label: "Posted by", required: true },
  { name: "date", label: "Date", type: "date", required: true },
  { name: "expires", label: "Expires", type: "date", required: true },
];

export function AnnouncementsView({ announcements, profile, today }: { announcements: Announcement[]; profile: Profile; today: string }) {
  const [filter, setFilter] = useState<"all" | Announcement["priority"]>("all");
  const [editing, setEditing] = useState<Announcement | "new" | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const { pending, run } = useServerAction();
  const filtered = announcements.filter((item) => filter === "all" || item.priority === filter).sort((a, b) => b.date.localeCompare(a.date));
  const empty = { title: "", body: "", priority: "medium", posted_by: profile.full_name, date: today, expires: today };
  const save = (values: Record<string, string>) => { const draft = { title: values.title, body: values.body, priority: values.priority as Announcement["priority"], posted_by: values.posted_by, date: values.date, expires: values.expires }; return editing === "new" ? createAnnouncement(draft) : updateAnnouncement({ ...editing!, ...draft } as Announcement); };
  return <div><SectionHeader title="Announcements" description={`${announcements.filter((item) => item.priority === "high").length} high priority`} className="mb-4" action={<ManagerOnly role={profile.role}><Button size="sm" onClick={() => setEditing("new")}><Plus size={14} />Post Announcement</Button></ManagerOnly>} /><div className="mb-4 flex gap-2 overflow-x-auto pb-1">{(["all", "high", "medium", "low"] as const).map((value) => <button type="button" key={value} onClick={() => setFilter(value)} className={cn("rounded-lg bg-muted px-3 py-1.5 text-xs font-medium capitalize text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700", filter === value && "bg-primary text-primary-foreground hover:bg-primary dark:hover:bg-primary")}>{value}</button>)}</div>{filtered.length === 0 ? <EmptyState title="No announcements" description="Nothing matches this priority filter." /> : <div className="flex flex-col gap-3">{filtered.map((item) => { const Icon = icons[item.priority]; return <article key={item.id} className={`group rounded-card border border-l-4 bg-card px-4 py-4 shadow-sm ${border[item.priority]}`}><div className="flex items-start gap-2"><Icon size={14} className={cn("mt-0.5 shrink-0", item.priority === "high" && "text-red-600", item.priority === "medium" && "text-amber-500", item.priority === "low" && "text-zinc-400")} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><h3 className="font-heading text-sm font-semibold">{item.title}</h3><PriorityBadge priority={item.priority} /></div><ManagerOnly role={profile.role}><div className="flex shrink-0 gap-1 sm:opacity-0 sm:group-hover:opacity-100"><button onClick={() => setEditing(item)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Edit ${item.title}`}><Pencil size={14} /></button><button onClick={() => setDeleting(item)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-red-600" aria-label={`Delete ${item.title}`}><Trash2 size={14} /></button></div></ManagerOnly></div><p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p><p className="mt-2 text-xs text-muted-foreground">By {item.posted_by} · {item.date} · Expires {item.expires}</p></div></div></article>; })}</div>}<EntityFormDialog open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Post Announcement" : "Edit Announcement"} fields={fields} initial={editing && editing !== "new" ? editing : empty} onSubmit={save} successMessage={editing === "new" ? "Announcement posted." : "Announcement updated."} /><ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleting && run(() => deleteAnnouncement(deleting.id), "Announcement deleted.", () => setDeleting(null))} title="Delete Announcement" description={`Delete ${deleting?.title ?? "this announcement"}?`} loading={pending} /></div>;
}