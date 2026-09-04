"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, requireManager, requireProfile, type ActionResult } from "@/lib/actions/common";
import { writeAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Event } from "@/lib/types";
import { eventSchema } from "@/lib/validations";

type EventDraft = Omit<Event, "id" | "registered" | "registrations">;
const eventDraftSchema = eventSchema.omit({ id: true, registered: true, registrations: true });

export async function createEvent(input: EventDraft): Promise<ActionResult> {
  try {
    const profile = await requireManager();
    const event = eventSchema.parse({ id: `evt-${randomUUID().slice(0, 8)}`, ...eventDraftSchema.parse(input), registered: 0, registrations: [] });
    const { error } = await createAdminClient().from("events").insert(event);
    if (error) throw new Error(error.message);
    await writeAudit({ profile, action: "create", entityType: "event", entityId: event.id, summary: `Added event ${event.name}` });
    revalidatePath("/"); return { ok: true };
  } catch (error) { return actionError(error); }
}

export async function updateEvent(input: Event): Promise<ActionResult> {
  try {
    const profile = await requireManager();
    let event = eventSchema.parse(input);
    if (event.capacity < event.registered) throw new Error("Capacity cannot be lower than current registrations.");
    if (event.capacity === event.registered && event.status === "upcoming") event = { ...event, status: "full" };
    const admin = createAdminClient();
    const { data: before, error: readError } = await admin.from("events").select("*").eq("id", event.id).single();
    if (readError) throw new Error(readError.message);
    const { error } = await admin.from("events").update(event).eq("id", event.id);
    if (error) throw new Error(error.message);
    await writeAudit({ profile, action: "update", entityType: "event", entityId: event.id, summary: `Updated event ${event.name}`, details: { before, after: event } });
    revalidatePath("/"); return { ok: true };
  } catch (error) { return actionError(error); }
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  try {
    const profile = await requireManager();
    const parsedId = z.string().min(1).parse(id);
    const admin = createAdminClient();
    const { data: event, error: readError } = await admin.from("events").select("*").eq("id", parsedId).single();
    if (readError) throw new Error(readError.message);
    const { error } = await admin.from("events").delete().eq("id", parsedId);
    if (error) throw new Error(error.message);
    await writeAudit({ profile, action: "delete", entityType: "event", entityId: parsedId, summary: `Deleted event ${event.name}`, details: { deleted: event } });
    revalidatePath("/"); return { ok: true };
  } catch (error) { return actionError(error); }
}

export async function registerForEvent(eventId: string): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const admin = createAdminClient();
    const { data, error: readError } = await admin.from("events").select("*").eq("id", eventId).single();
    if (readError) throw new Error(readError.message);
    const event = eventSchema.parse(data);
    if (event.registrations.some((item) => item.student_id === profile.id)) throw new Error("You are already registered.");
    if (event.status === "cancelled" || event.status === "completed") throw new Error("Registration is closed.");
    if (event.registered >= event.capacity || event.status === "full") throw new Error("This event is full.");
    const registrations = [...event.registrations, { student_id: profile.id, name: profile.full_name }];
    const registered = event.registered + 1;
    const status = registered >= event.capacity ? "full" : event.status;
    const { error } = await admin.from("events").update({ registrations, registered, status }).eq("id", event.id);
    if (error) throw new Error(error.message);
    await writeAudit({ profile, action: "register", entityType: "event", entityId: event.id, summary: `Registered for ${event.name}` });
    revalidatePath("/"); return { ok: true };
  } catch (error) { return actionError(error); }
}

export async function cancelEventRegistration(eventId: string): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const admin = createAdminClient();
    const { data, error: readError } = await admin.from("events").select("*").eq("id", eventId).single();
    if (readError) throw new Error(readError.message);
    const event = eventSchema.parse(data);
    if (!event.registrations.some((item) => item.student_id === profile.id)) throw new Error("Registration not found.");
    const registrations = event.registrations.filter((item) => item.student_id !== profile.id);
    const status = event.status === "full" ? "upcoming" : event.status;
    const { error } = await admin.from("events").update({ registrations, registered: Math.max(0, event.registered - 1), status }).eq("id", event.id);
    if (error) throw new Error(error.message);
    await writeAudit({ profile, action: "cancel_registration", entityType: "event", entityId: event.id, summary: `Cancelled registration for ${event.name}` });
    revalidatePath("/"); return { ok: true };
  } catch (error) { return actionError(error); }
}