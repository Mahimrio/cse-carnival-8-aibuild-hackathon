"use client";

import { Bell, BookOpen, CalendarCheck, CalendarDays, Clock, Layers, Plus } from "lucide-react";
import { useState } from "react";
import { ManagerOnly } from "@/components/auth/manager-only";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs } from "@/components/ui/tabs";
import type { Profile } from "@/lib/types";

const systems = {
  schedule: { label: "Schedule", singular: "class", description: "Weekly classes across Sunday to Thursday", icon: CalendarDays },
  rooms: { label: "Rooms", singular: "room", description: "Campus classrooms, labs, capacity, and equipment", icon: Layers },
  events: { label: "Events", singular: "event", description: "Upcoming campus activities and registrations", icon: CalendarCheck },
  announcements: { label: "Announcements", singular: "announcement", description: "Priority notices and department updates", icon: Bell },
  assignments: { label: "Assignments", singular: "assignment", description: "Coursework deadlines and submission status", icon: BookOpen },
} as const;

type SystemId = keyof typeof systems;

export function DashboardFrame({ profile, today, dayName }: { profile: Profile; today: string; dayName: string }) {
  const [activeSystem, setActiveSystem] = useState<SystemId>("schedule");
  const system = systems[activeSystem];
  const Icon = system.icon;
  const tabs = (Object.entries(systems) as [SystemId, typeof systems[SystemId]][]).map(([id, item]) => ({ id, label: item.label, icon: <item.icon aria-hidden="true" size={15} /> }));

  return (
    <div>
      <div className="mb-6"><h1 className="font-heading text-2xl font-bold">Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">{today} · {dayName} · Welcome back, {profile.full_name}</p></div>
      <div className="mb-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Next Class" value="—" detail="Live schedule summary" icon={Clock} />
        <StatCard label="Due This Week" value="—" detail="Pending assignment deadlines" icon={BookOpen} tone="amber" />
        <StatCard label="High Priority" value="—" detail="Active announcements" icon={Bell} tone="red" />
        <StatCard label="Upcoming Events" value="—" detail="Open campus events" icon={CalendarCheck} tone="blue" />
      </div>
      <div className="mb-6 overflow-x-auto pb-1"><Tabs tabs={tabs} activeTab={activeSystem} onChange={(id) => setActiveSystem(id as SystemId)} className="min-w-max sm:min-w-full" /></div>
      <section aria-labelledby={`${activeSystem}-heading`}>
        <SectionHeader title={system.label} description={system.description} className="mb-4" action={<ManagerOnly role={profile.role}><Button size="sm" disabled title={`Add ${system.singular} controls arrive with CRUD`}><Plus aria-hidden="true" size={15} />Add {system.singular}</Button></ManagerOnly>} />
        <EmptyState title={`${system.label} are ready to connect`} description="Live campus records will appear in this section." icon={<Icon aria-hidden="true" size={22} />} />
      </section>
    </div>
  );
}