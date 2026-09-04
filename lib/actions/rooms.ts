"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, requireManager, requireProfile, type ActionResult } from "@/lib/actions/common";
import { writeAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Booking, Room } from "@/lib/types";
import { bookingSchema, roomSchema } from "@/lib/validations";

type RoomDraft = Omit<Room, "id" | "bookings">;
const roomDraftSchema = roomSchema.omit({ id: true, bookings: true });
const bookingDraftSchema = bookingSchema.omit({ booking_id: true, booked_by: true });

export async function createRoom(input: RoomDraft): Promise<ActionResult> {
  try {
    const profile = await requireManager();
    const room = roomSchema.parse({ id: `room-${randomUUID().slice(0, 8)}`, ...roomDraftSchema.parse(input), bookings: [] });
    const { error } = await createAdminClient().from("rooms").insert(room);
    if (error) throw new Error(error.message);
    await writeAudit({ profile, action: "create", entityType: "room", entityId: room.id, summary: `Added room ${room.room_number}` });
    revalidatePath("/"); return { ok: true };
  } catch (error) { return actionError(error); }
}

export async function updateRoom(input: Room): Promise<ActionResult> {
  try {
    const profile = await requireManager();
    const room = roomSchema.parse(input);
    const admin = createAdminClient();
    const { data: before, error: readError } = await admin.from("rooms").select("*").eq("id", room.id).single();
    if (readError) throw new Error(readError.message);
    const { error } = await admin.from("rooms").update(room).eq("id", room.id);
    if (error) throw new Error(error.message);
    await writeAudit({ profile, action: "update", entityType: "room", entityId: room.id, summary: `Updated room ${room.room_number}`, details: { before, after: room } });
    revalidatePath("/"); return { ok: true };
  } catch (error) { return actionError(error); }
}

export async function deleteRoom(id: string): Promise<ActionResult> {
  try {
    const profile = await requireManager();
    const parsedId = z.string().min(1).parse(id);
    const admin = createAdminClient();
    const { data: room, error: readError } = await admin.from("rooms").select("*").eq("id", parsedId).single();
    if (readError) throw new Error(readError.message);
    const { error } = await admin.from("rooms").delete().eq("id", parsedId);
    if (error) throw new Error(error.message);
    await writeAudit({ profile, action: "delete", entityType: "room", entityId: parsedId, summary: `Deleted room ${room.room_number}`, details: { deleted: room } });
    revalidatePath("/"); return { ok: true };
  } catch (error) { return actionError(error); }
}

export async function bookRoom(roomId: string, input: Omit<Booking, "booking_id" | "booked_by">): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const draft = bookingDraftSchema.parse(input);
    if (draft.start_time >= draft.end_time) throw new Error("End time must be after start time.");
    const admin = createAdminClient();
    const { data, error: readError } = await admin.from("rooms").select("*").eq("id", roomId).single();
    if (readError) throw new Error(readError.message);
    const room = roomSchema.parse(data);
    if (room.status !== "available") throw new Error("This room is unavailable.");
    const conflict = room.bookings.find((booking) => booking.date === draft.date && draft.start_time < booking.end_time && draft.end_time > booking.start_time);
    if (conflict) throw new Error(`Room already booked from ${conflict.start_time} to ${conflict.end_time}.`);
    const booking = bookingSchema.parse({ booking_id: `bk-${randomUUID().slice(0, 8)}`, booked_by: profile.full_name, ...draft });
    const { error } = await admin.from("rooms").update({ bookings: [...room.bookings, booking] }).eq("id", room.id);
    if (error) throw new Error(error.message);
    await writeAudit({ profile, action: "book", entityType: "room", entityId: room.id, summary: `Booked ${room.room_number} on ${booking.date} ${booking.start_time}-${booking.end_time}`, details: { booking } });
    revalidatePath("/"); return { ok: true };
  } catch (error) { return actionError(error); }
}

export async function cancelRoomBooking(roomId: string, bookingId: string): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const admin = createAdminClient();
    const { data, error: readError } = await admin.from("rooms").select("*").eq("id", roomId).single();
    if (readError) throw new Error(readError.message);
    const room = roomSchema.parse(data);
    const booking = room.bookings.find((item) => item.booking_id === bookingId);
    if (!booking) throw new Error("Booking not found.");
    const { error } = await admin.from("rooms").update({ bookings: room.bookings.filter((item) => item.booking_id !== bookingId) }).eq("id", room.id);
    if (error) throw new Error(error.message);
    await writeAudit({ profile, action: "cancel_booking", entityType: "room", entityId: room.id, summary: `Cancelled booking for ${room.room_number} on ${booking.date}`, details: { booking } });
    revalidatePath("/"); return { ok: true };
  } catch (error) { return actionError(error); }
}