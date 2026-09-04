"use client";

import { BookOpen, Clock, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ManagerOnly } from "@/components/auth/manager-only";
import { EntityFormDialog, type EntityField } from "@/components/systems/entity-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/domain-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { useServerAction } from "@/hooks/use-server-action";
import { createAssignment, deleteAssignment, updateAssignment } from "@/lib/actions/assignments";
import type { Assignment, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

const fields: EntityField[] = [
  { name: "course", label: "Course code", required: true },
  { name: "course_title", label: "Course title", required: true },
  { name: "title", label: "Assignment title", required: true, full: true },
  { name: "description", label: "Description", type: "textarea", required: true, full: true },
  { name: "assigned_date", label: "Assigned date", type: "date", required: true },
  { name: "deadline", label: "Deadline", type: "date", required: true },
  { name: "marks", label: "Marks", type: "number", required: true },
  { name: "status", label: "Status", type: "select", options: ["pending", "submitted", "graded", "late"].map((value) => ({ value, label: value })) },
  { name: "submission_platform", label: "Submission platform", required: true, full: true },
];
function dueSoon(deadline: string, today: string) { const days = Math.floor((new Date(`${deadline}T12:00:00Z`).getTime() - new Date(`${today}T12:00:00Z`).getTime()) / 86_400_000); return days >= 0 && days <= 7; }

export function AssignmentsView({ assignments, today, profile }: { assignments: Assignment[]; today: string; profile: Profile }) {
  const [filter, setFilter] = useState<"all" | Assignment["status"]>("all");
  const [editing, setEditing] = useState<Assignment | "new" | null>(null);
  const [deleting, setDeleting] = useState<Assignment | null>(null);
  const { pending, run } = useServerAction();
  const filtered = assignments.filter((item) => filter === "all" || item.status === filter).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const dueCount = assignments.filter((item) => item.status === "pending" && dueSoon(item.deadline, today)).length;
  const empty = { course: "", course_title: "", title: "", description: "", assigned_date: today, deadline: today, submission_platform: "Google Classroom", status: "pending", marks: 10 };
  const save = (values: Record<string, string>) => { const draft = { course: values.course, course_title: values.course_title, title: values.title, description: values.description, assigned_date: values.assigned_date, deadline: values.deadline, submission_platform: values.submission_platform, status: values.status as Assignment["status"], marks: Number(values.marks) }; return editing === "new" ? createAssignment(draft) : updateAssignment({ ...editing!, ...draft } as Assignment); };
  return <div><SectionHeader title="Assignments" description={`${dueCount} due this week · ${assignments.filter((item) => item.status === "pending").length} pending`} className="mb-4" action={<ManagerOnly role={profile.role}><Button size="sm" onClick={() => setEditing("new")}><Plus size={14} />Add Assignment</Button></ManagerOnly>} /><div className="mb-4 flex gap-2 overflow-x-auto pb-1">{(["all", "pending", "submitted", "graded", "late"] as const).map((value) => <button type="button" key={value} onClick={() => setFilter(value)} className={cn("whitespace-nowrap rounded-lg bg-muted px-3 py-1.5 text-xs font-medium capitalize text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700", filter === value && "bg-primary text-primary-foreground hover:bg-primary dark:hover:bg-primary")}>{value}</button>)}</div>{filtered.length === 0 ? <EmptyState title="No assignments" description="No assignments match this status filter." /> : <div className="flex flex-col gap-3">{filtered.map((item) => { const due = item.status === "pending" && dueSoon(item.deadline, today); return <article key={item.id} className={cn("group rounded-card border bg-card px-4 py-4 shadow-sm", due && "border-amber-300 dark:border-amber-700")}><div className="mb-1 flex items-start justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><Badge className="bg-teal-50 font-mono text-primary dark:bg-teal-900/20">{item.course}</Badge><StatusBadge status={item.status} />{due && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Due this week</Badge>}</div><ManagerOnly role={profile.role}><div className="flex shrink-0 gap-1 sm:opacity-0 sm:group-hover:opacity-100"><button onClick={() => setEditing(item)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Edit ${item.title}`}><Pencil size={14} /></button><button onClick={() => setDeleting(item)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-red-600" aria-label={`Delete ${item.title}`}><Trash2 size={14} /></button></div></ManagerOnly></div><h3 className="font-heading text-sm font-semibold">{item.title}</h3><p className="mt-0.5 text-xs text-muted-foreground">{item.course_title}</p><p className="my-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.description}</p><div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock size={11} />Deadline: <strong className={due ? "text-amber-600 dark:text-amber-400" : ""}>{item.deadline}</strong></span><span className="flex items-center gap-1"><BookOpen size={11} />{item.marks} marks</span><span className="flex items-center gap-1"><ExternalLink size={11} />{item.submission_platform}</span></div></article>; })}</div>}<EntityFormDialog open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add Assignment" : "Edit Assignment"} fields={fields} initial={editing && editing !== "new" ? editing : empty} onSubmit={save} successMessage={editing === "new" ? "Assignment added." : "Assignment updated."} /><ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleting && run(() => deleteAssignment(deleting.id), "Assignment deleted.", () => setDeleting(null))} title="Delete Assignment" description={`Delete ${deleting?.title ?? "this assignment"}?`} loading={pending} /></div>;
}