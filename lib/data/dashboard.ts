import { createAdminClient } from "@/lib/supabase/admin";
import type { Announcement, Assignment, AuditLog, Event, Room, Schedule } from "@/lib/types";

export interface DashboardData {
  schedules: Schedule[];
  rooms: Room[];
  events: Event[];
  announcements: Announcement[];
  assignments: Assignment[];
  recentActivity: AuditLog[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createAdminClient();
  const [schedules, rooms, events, announcements, assignments, recentActivity] = await Promise.all([
    supabase.from("schedules").select("*").order("start_time"),
    supabase.from("rooms").select("*").order("room_number"),
    supabase.from("events").select("*").order("date"),
    supabase.from("announcements").select("*").order("date", { ascending: false }),
    supabase.from("assignments").select("*").order("deadline"),
    supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  const failed = [schedules, rooms, events, announcements, assignments, recentActivity].find((result) => result.error);
  if (failed?.error) throw new Error(`Unable to load campus data: ${failed.error.message}`);

  return {
    schedules: (schedules.data ?? []) as Schedule[],
    rooms: (rooms.data ?? []) as Room[],
    events: (events.data ?? []) as Event[],
    announcements: (announcements.data ?? []) as Announcement[],
    assignments: (assignments.data ?? []) as Assignment[],
    recentActivity: (recentActivity.data ?? []) as AuditLog[],
  };
}