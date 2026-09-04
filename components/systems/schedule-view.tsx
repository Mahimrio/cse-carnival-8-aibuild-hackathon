"use client";

import { Clock, MapPin } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs } from "@/components/ui/tabs";
import type { Schedule } from "@/lib/types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] as const;
const colors = {
  Sunday: "border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-900/10",
  Monday: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10",
  Tuesday: "border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/10",
  Wednesday: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10",
  Thursday: "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/10",
};

export function ScheduleView({ schedules, todayName }: { schedules: Schedule[]; todayName: string }) {
  const initialDay = DAYS.find((day) => day === todayName) ?? "Sunday";
  const [day, setDay] = useState<string>(initialDay);
  const filtered = schedules.filter((item) => item.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const tabs = DAYS.map((item) => ({ id: item, label: item, badge: schedules.filter((schedule) => schedule.day === item).length }));
  return <div><SectionHeader title="Class Schedule" description={`${schedules.length} classes across the week`} className="mb-4" /><div className="mb-4 overflow-x-auto pb-1"><Tabs tabs={tabs} activeTab={day} onChange={setDay} className="min-w-max sm:min-w-full" /></div>{filtered.length === 0 ? <EmptyState title="No classes on this day" description="The academic schedule has no classes for this day." /> : <div className="flex flex-col gap-3">{filtered.map((item) => <article key={item.id} className={`flex items-start gap-4 rounded-card border px-4 py-3.5 ${colors[item.day]}`}><div className="w-20 shrink-0 text-center"><p className="text-xs font-semibold tabular-nums text-muted-foreground">{item.start_time}</p><div className="mx-auto my-1 h-4 w-0 border-l-2" /><p className="text-xs tabular-nums text-muted-foreground">{item.end_time}</p></div><div className="min-w-0 flex-1"><h3 className="font-heading text-sm font-semibold">{item.title}</h3><p className="mt-0.5 text-xs text-muted-foreground">{item.course}</p><div className="mt-2 flex flex-wrap items-center gap-3"><span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin aria-hidden="true" size={11} />{item.room}</span><span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock aria-hidden="true" size={11} />{item.instructor}</span><Badge>Section {item.section}</Badge></div></div></article>)}</div>}</div>;
}