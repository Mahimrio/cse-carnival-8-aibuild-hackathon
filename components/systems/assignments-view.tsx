"use client";

import { BookOpen, Clock, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/domain-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import type { Assignment } from "@/lib/types";
import { cn } from "@/lib/utils";

function isDueSoon(deadline: string, today: string) {
  const difference = new Date(`${deadline}T12:00:00Z`).getTime() - new Date(`${today}T12:00:00Z`).getTime();
  const days = Math.floor(difference / 86_400_000);
  return days >= 0 && days <= 7;
}

export function AssignmentsView({ assignments, today }: { assignments: Assignment[]; today: string }) {
  const [filter, setFilter] = useState<"all" | Assignment["status"]>("all");
  const filtered = assignments.filter((item) => filter === "all" || item.status === filter).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const dueCount = assignments.filter((item) => item.status === "pending" && isDueSoon(item.deadline, today)).length;
  return <div><SectionHeader title="Assignments" description={`${dueCount} due this week · ${assignments.filter((item) => item.status === "pending").length} pending`} className="mb-4" /><div className="mb-4 flex gap-2 overflow-x-auto pb-1">{(["all", "pending", "submitted", "graded", "late"] as const).map((value) => <button type="button" key={value} onClick={() => setFilter(value)} className={cn("whitespace-nowrap rounded-lg bg-muted px-3 py-1.5 text-xs font-medium capitalize text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700", filter === value && "bg-primary text-primary-foreground hover:bg-primary dark:hover:bg-primary")}>{value}</button>)}</div>{filtered.length === 0 ? <EmptyState title="No assignments" description="No assignments match this status filter." /> : <div className="flex flex-col gap-3">{filtered.map((item) => { const dueSoon = item.status === "pending" && isDueSoon(item.deadline, today); return <article key={item.id} className={cn("rounded-card border bg-card px-4 py-4 shadow-sm", dueSoon && "border-amber-300 dark:border-amber-700")}><div className="mb-1 flex flex-wrap items-center gap-2"><Badge className="bg-teal-50 font-mono text-primary dark:bg-teal-900/20">{item.course}</Badge><StatusBadge status={item.status} />{dueSoon && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Due this week</Badge>}</div><h3 className="font-heading text-sm font-semibold">{item.title}</h3><p className="mt-0.5 text-xs text-muted-foreground">{item.course_title}</p><p className="my-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.description}</p><div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock aria-hidden="true" size={11} />Deadline: <strong className={dueSoon ? "text-amber-600 dark:text-amber-400" : ""}>{item.deadline}</strong></span><span className="flex items-center gap-1"><BookOpen aria-hidden="true" size={11} />{item.marks} marks</span><span className="flex items-center gap-1"><ExternalLink aria-hidden="true" size={11} />{item.submission_platform}</span></div></article>; })}</div>}</div>;
}