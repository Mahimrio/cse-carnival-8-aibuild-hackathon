"use client";

import { Clock, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ManagerOnly } from "@/components/auth/manager-only";
import { EntityFormDialog, type EntityField } from "@/components/systems/entity-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs } from "@/components/ui/tabs";
import { createSchedule, deleteSchedule, updateSchedule } from "@/lib/actions/schedules";
import type { Profile, Schedule } from "@/lib/types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] as const;
const colors = {
  Sunday: "border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-900/10",
  Monday: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10",
  Tuesday: "border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/10",
  Wednesday: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10",
  Thursday: "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/10",
};

const fields: EntityField[] = [
  { name: "course", label: "Course code", required: true, placeholder: "CSE 4113" },
  { name: "day", label: "Day", type: "select", required: true, options: DAYS.map((day) => ({ value: day, label: day })) },
  { name: "title", label: "Course title", required: true, full: true },
  { name: "start_time", label: "Start time", type: "time", required: true },
  { name: "end_time", label: "End time", type: "time", required: true },
  { name: "room", label: "Room", required: true },
  { name: "section", label: "Section", required: true },
  { name: "instructor", label: "Instructor", required: true, full: true },
];

const emptySchedule = { course: "", title: "", day: "Sunday", start_time: "", end_time: "", room: "", instructor: "", section: "" };

export function ScheduleView({ schedules, todayName, profile }: { schedules: Schedule[]; todayName: string; profile: Profile }) {
  const initialDay = DAYS.find((day) => day === todayName) ?? "Sunday";
  const [day, setDay] = useState<string>(initialDay);
  const [editing, setEditing] = useState<Schedule | "new" | null>(null);
  const [deleting, setDeleting] = useState<Schedule | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const filtered = schedules.filter((item) => item.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const tabs = DAYS.map((item) => ({ id: item, label: item, badge: schedules.filter((schedule) => schedule.day === item).length }));
  const save = (values: Record<string, string>) => editing === "new" ? createSchedule(values as Omit<Schedule, "id">) : updateSchedule({ ...editing!, ...values } as Schedule);
  const remove = () => deleting && startTransition(async () => { const result = await deleteSchedule(deleting.id); if (!result.ok) { toast.error(result.error); return; } toast.success("Class deleted."); setDeleting(null); router.refresh(); });
  return <div><SectionHeader title="Class Schedule" description={`${schedules.length} classes across the week`} className="mb-4" action={<ManagerOnly role={profile.role}><Button size="sm" onClick={() => setEditing("new")}><Plus size={14} />Add Class</Button></ManagerOnly>} /><div className="mb-4 overflow-x-auto pb-1"><Tabs tabs={tabs} activeTab={day} onChange={setDay} className="min-w-max sm:min-w-full" /></div>{filtered.length === 0 ? <EmptyState title="No classes on this day" description="The academic schedule has no classes for this day." /> : <div className="flex flex-col gap-3">{filtered.map((item) => <article key={item.id} className={`group flex items-start gap-4 rounded-card border px-4 py-3.5 ${colors[item.day]}`}><div className="w-20 shrink-0 text-center"><p className="text-xs font-semibold tabular-nums text-muted-foreground">{item.start_time}</p><div className="mx-auto my-1 h-4 w-0 border-l-2" /><p className="text-xs tabular-nums text-muted-foreground">{item.end_time}</p></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h3 className="font-heading text-sm font-semibold">{item.title}</h3><p className="mt-0.5 text-xs text-muted-foreground">{item.course}</p></div><ManagerOnly role={profile.role}><div className="flex shrink-0 gap-1 sm:opacity-0 sm:group-hover:opacity-100"><button onClick={() => setEditing(item)} className="rounded p-1.5 text-muted-foreground hover:bg-white hover:text-foreground dark:hover:bg-zinc-700" aria-label={`Edit ${item.course}`}><Pencil size={14} /></button><button onClick={() => setDeleting(item)} className="rounded p-1.5 text-muted-foreground hover:bg-white hover:text-red-600 dark:hover:bg-zinc-700" aria-label={`Delete ${item.course}`}><Trash2 size={14} /></button></div></ManagerOnly></div><div className="mt-2 flex flex-wrap items-center gap-3"><span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin aria-hidden="true" size={11} />{item.room}</span><span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock aria-hidden="true" size={11} />{item.instructor}</span><Badge>Section {item.section}</Badge></div></div></article>)}</div>}<EntityFormDialog open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add Class" : "Edit Class"} fields={fields} initial={editing && editing !== "new" ? editing : { ...emptySchedule, day }} onSubmit={save} successMessage={editing === "new" ? "Class added." : "Class updated."} /><ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} title="Delete Class" description={`Delete ${deleting?.course ?? "this class"}? This cannot be undone.`} loading={pending} /></div>;
}