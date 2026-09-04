"use server";

import { revalidatePath } from "next/cache";
import { actionError, requireManager, type ActionResult } from "@/lib/actions/common";
import { createAnnouncement, deleteAnnouncement, updateAnnouncement } from "@/lib/actions/announcements";
import { createAssignment, deleteAssignment, updateAssignment } from "@/lib/actions/assignments";
import { createEvent, deleteEvent, updateEvent } from "@/lib/actions/events";
import { createRoom, deleteRoom, updateRoom } from "@/lib/actions/rooms";
import { createSchedule, deleteSchedule, updateSchedule } from "@/lib/actions/schedules";
import { writeAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Announcement, Assignment, Event, PendingChange, Room, Schedule } from "@/lib/types";

function proposalData(change: PendingChange) {
  const wrapper = change.payload as { data?: Record<string, unknown> };
  return wrapper.data ?? change.payload;
}

async function applyProposal(change: PendingChange): Promise<ActionResult> {
  const payload = proposalData(change);
  const admin = createAdminClient();
  if (change.operation !== "add" && !change.target_id) return { ok: false, error: "This proposal does not identify an existing record." };

  if (change.entity_type === "schedule") {
    if (change.operation === "add") return createSchedule(payload as Omit<Schedule, "id">);
    if (change.operation === "delete") return deleteSchedule(change.target_id!);
    const { data, error } = await admin.from("schedules").select("*").eq("id", change.target_id!).single();
    if (error) return { ok: false, error: error.message };
    return updateSchedule({ ...data, ...payload, id: change.target_id } as Schedule);
  }
  if (change.entity_type === "room") {
    if (change.operation === "add") return createRoom(payload as Omit<Room, "id" | "bookings">);
    if (change.operation === "delete") return deleteRoom(change.target_id!);
    const { data, error } = await admin.from("rooms").select("*").eq("id", change.target_id!).single();
    if (error) return { ok: false, error: error.message };
    return updateRoom({ ...data, ...payload, id: change.target_id } as Room);
  }
  if (change.entity_type === "event") {
    if (change.operation === "add") return createEvent(payload as Omit<Event, "id" | "registered" | "registrations">);
    if (change.operation === "delete") return deleteEvent(change.target_id!);
    const { data, error } = await admin.from("events").select("*").eq("id", change.target_id!).single();
    if (error) return { ok: false, error: error.message };
    return updateEvent({ ...data, ...payload, id: change.target_id } as Event);
  }
  if (change.entity_type === "announcement") {
    if (change.operation === "add") return createAnnouncement(payload as Omit<Announcement, "id">);
    if (change.operation === "delete") return deleteAnnouncement(change.target_id!);
    const { data, error } = await admin.from("announcements").select("*").eq("id", change.target_id!).single();
    if (error) return { ok: false, error: error.message };
    return updateAnnouncement({ ...data, ...payload, id: change.target_id } as Announcement);
  }
  if (change.operation === "add") return createAssignment(payload as Omit<Assignment, "id">);
  if (change.operation === "delete") return deleteAssignment(change.target_id!);
  const { data, error } = await admin.from("assignments").select("*").eq("id", change.target_id!).single();
  if (error) return { ok: false, error: error.message };
  return updateAssignment({ ...data, ...payload, id: change.target_id } as Assignment);
}

export async function acceptPendingChange(id: string): Promise<ActionResult> {
  try {
    const profile = await requireManager();
    const admin = createAdminClient();
    const { data, error } = await admin.from("pending_changes").select("*").eq("id", id).single();
    if (error) throw new Error(error.message);
    const change = data as PendingChange;
    if (change.status !== "pending") throw new Error("This proposal has already been reviewed.");
    const applied = await applyProposal(change);
    if (!applied.ok) throw new Error(applied.error);
    const { error: updateError } = await admin.from("pending_changes").update({ status: "accepted", reviewed_by: profile.id === "00000000-0000-0000-0000-000000000000" ? null : profile.id, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (updateError) throw new Error(updateError.message);
    await writeAudit({ profile, action: "smart_entry_accept", entityType: change.entity_type, entityId: change.target_id ?? change.id, summary: `Accepted Smart Entry ${change.operation} for ${change.entity_type}`, details: { pending_change_id: change.id, payload: proposalData(change) } });
    revalidatePath("/"); revalidatePath("/smart-entry"); return { ok: true };
  } catch (error) { return actionError(error); }
}

export async function rejectPendingChange(id: string): Promise<ActionResult> {
  try {
    const profile = await requireManager();
    const admin = createAdminClient();
    const { data, error } = await admin.from("pending_changes").select("*").eq("id", id).single();
    if (error) throw new Error(error.message);
    const change = data as PendingChange;
    if (change.status !== "pending") throw new Error("This proposal has already been reviewed.");
    const { error: updateError } = await admin.from("pending_changes").update({ status: "rejected", reviewed_by: profile.id === "00000000-0000-0000-0000-000000000000" ? null : profile.id, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (updateError) throw new Error(updateError.message);
    await writeAudit({ profile, action: "smart_entry_reject", entityType: change.entity_type, entityId: change.target_id ?? change.id, summary: `Rejected Smart Entry ${change.operation} for ${change.entity_type}`, details: { pending_change_id: change.id } });
    revalidatePath("/smart-entry"); return { ok: true };
  } catch (error) { return actionError(error); }
}