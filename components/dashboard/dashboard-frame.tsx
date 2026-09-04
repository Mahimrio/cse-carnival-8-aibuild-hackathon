"use client";

import Link from "next/link";
import { ArrowRight, Bell, BookOpen, CalendarCheck, CalendarDays, Clock, History, Layers } from "lucide-react";
import { useState } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { LiveDashboardRefresh } from "@/components/dashboard/live-dashboard-refresh";
import { AnnouncementsView } from "@/components/systems/announcements-view";
import { AssignmentsView } from "@/components/systems/assignments-view";
import { EventsView } from "@/components/systems/events-view";
import { RoomsView } from "@/components/systems/rooms-view";
import { ScheduleView } from "@/components/systems/schedule-view";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { auditActionColor, formatAuditAction } from "@/lib/audit-format";
import type { DashboardData } from "@/lib/data/dashboard";
import type { Profile } from "@/lib/types";

const systems = {
  schedule: { label: "Schedule", singular: "class", description: "Weekly classes across Sunday to Thursday", icon: CalendarDays },
  rooms: { label: "Rooms", singular: "room", description: "Campus classrooms, labs, capacity, and equipment", icon: Layers },
  events: { label: "Events", singular: "event", description: "Upcoming campus activities and registrations", icon: CalendarCheck },
  announcements: { label: "Announcements", singular: "announcement", description: "Priority notices and department updates", icon: Bell },
  assignments: { label: "Assignments", singular: "assignment", description: "Coursework deadlines and submission status", icon: BookOpen },
} as const;

type SystemId = keyof typeof systems;

function isDueThisWeek(deadline: string, today: string) {
  const due = new Date(`${deadline}T12:00:00Z`);
  const start = new Date(`${today}T12:00:00Z`);
  const daysUntil = Math.floor((due.getTime() - start.getTime()) / 86_400_000);
  return daysUntil >= 0 && daysUntil <= 7;
}

function getNextClass(data: DashboardData, dayName: string, currentTime: string) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] as const;
  const todayIndex = days.findIndex((day) => day === dayName);
  if (todayIndex >= 0) {
    const laterToday = data.schedules.filter((item) => item.day === dayName && item.start_time >= currentTime).sort((a, b) => a.start_time.localeCompare(b.start_time));
    if (laterToday[0]) return { ...laterToday[0], relativeDay: "Today" };
  }
  for (let offset = 1; offset <= days.length; offset += 1) {
    const day = days[((Math.max(todayIndex, -1) + offset) % days.length + days.length) % days.length];
    const next = data.schedules.filter((item) => item.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time))[0];
    if (next) return { ...next, relativeDay: day };
  }
  return null;
}

export function DashboardFrame({ profile, today, dayName, currentTime, data }: { profile: Profile; today: string; dayName: string; currentTime: string; data: DashboardData }) {
  const [activeSystem, setActiveSystem] = useState<SystemId>("schedule");
  const dueThisWeek = data.assignments.filter((item) => item.status === "pending" && isDueThisWeek(item.deadline, today));
  const highPriority = data.announcements.filter((item) => item.priority === "high" && item.expires >= today);
  const upcomingEvents = data.events.filter((item) => item.status === "upcoming" || item.status === "full");
  const nextClass = getNextClass(data, dayName, currentTime);
  const tabs = (Object.entries(systems) as [SystemId, typeof systems[SystemId]][]).map(([id, item]) => ({ id, label: item.label, icon: <item.icon aria-hidden="true" size={15} />, badge: id === "announcements" ? highPriority.length : id === "assignments" ? dueThisWeek.length : undefined }));

  return (
    <div>
      <LiveDashboardRefresh />
      <div className="mb-6"><h1 className="font-heading text-2xl font-bold">Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">{today} · {dayName} · Welcome back, {profile.full_name}</p></div>
      <div className="mb-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Next Class" value={nextClass?.course ?? "None"} detail={nextClass ? `${nextClass.relativeDay} at ${nextClass.start_time} · ${nextClass.room}` : "No upcoming classes"} icon={Clock} />
        <StatCard label="Due This Week" value={String(dueThisWeek.length)} detail={dueThisWeek[0] ? `Earliest: ${dueThisWeek[0].deadline}` : "No pending deadlines"} icon={BookOpen} tone="amber" />
        <StatCard label="High Priority" value={String(highPriority.length)} detail="Active announcements" icon={Bell} tone="red" />
        <StatCard label="Upcoming Events" value={String(upcomingEvents.length)} detail={`${upcomingEvents.filter((event) => event.status === "full").length} full`} icon={CalendarCheck} tone="blue" />
      </div>
      <div className="mb-6 overflow-x-auto pb-1"><Tabs tabs={tabs} activeTab={activeSystem} onChange={(id) => setActiveSystem(id as SystemId)} className="min-w-max sm:min-w-full" /></div>
      <section aria-live="polite">
        {activeSystem === "schedule" && <ScheduleView schedules={data.schedules} todayName={dayName} profile={profile} />}
        {activeSystem === "rooms" && <RoomsView rooms={data.rooms} profile={profile} today={today} />}
        {activeSystem === "events" && <EventsView events={data.events} profile={profile} />}
        {activeSystem === "announcements" && <AnnouncementsView announcements={data.announcements} profile={profile} today={today} />}
        {activeSystem === "assignments" && <AssignmentsView assignments={data.assignments} today={today} profile={profile} />}
      </section>
      <Card className="mt-8">
        <CardContent className="pt-5">
          <div className="mb-4 flex items-center justify-between gap-4"><div><h2 className="flex items-center gap-2 font-heading font-semibold"><History aria-hidden="true" size={17} className="text-primary" />Recent Activity</h2><p className="mt-1 text-xs text-muted-foreground">Latest changes across CampusOS</p></div><Link href="/history" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">View all <ArrowRight aria-hidden="true" size={14} /></Link></div>
          {data.recentActivity.length === 0 ? <p className="py-4 text-sm text-muted-foreground">No activity has been recorded yet.</p> : <div className="divide-y">{data.recentActivity.map((entry) => <div key={entry.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"><Badge className={auditActionColor(entry.action)}>{formatAuditAction(entry.action)}</Badge><div className="min-w-0 flex-1"><p className="truncate text-sm">{entry.summary}</p><p className="mt-0.5 text-xs text-muted-foreground">{entry.actor_label}</p></div><time className="shrink-0 text-xs text-muted-foreground" dateTime={entry.created_at}>{entry.created_at.slice(0, 10)}</time></div>)}</div>}
        </CardContent>
      </Card>
    </div>
  );
}