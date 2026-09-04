"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { writeAudit } from "@/lib/audit";
import { actionError, requireManager, type ActionResult } from "@/lib/actions/common";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Schedule } from "@/lib/types";
import { scheduleSchema } from "@/lib/validations";

type ScheduleDraft = Omit<Schedule, "id">;

export async function createSchedule(input: ScheduleDraft): Promise<ActionResult> {
  try {
    const profile = await requireManager();
    const schedule = scheduleSchema.parse({ id: `sch-${randomUUID().slice(0, 8)}`, ...input });
    const admin = createAdminClient();
    const { error } = await admin.from("schedules").insert(schedule);
    if (error) throw new Error(error.message);
    await writeAudit({ profile, action: "create", entityType: "schedule", entityId: schedule.id, summary: `Added ${schedule.course} on ${schedule.day}` });
    revalidatePath("/");
    return { ok: true };
  } catch (error) { return actionError(error); }
}

export async function updateSchedule(input: Schedule): Promise<ActionResult> {
  try {
    const profile = await requireManager();
    const schedule = scheduleSchema.parse(input);
    const admin = createAdminClient();
    const { data: before, error: readError } = await admin.from("schedules").select("*").eq("id", schedule.id).single();
    if (readError) throw new Error(readError.message);
    const { error } = await admin.from("schedules").update(schedule).eq("id", schedule.id);
    if (error) throw new Error(error.message);
    await writeAudit({ profile, action: "update", entityType: "schedule", entityId: schedule.id, summary: `Updated ${schedule.course} on ${schedule.day}`, details: { before, after: schedule } });
    revalidatePath("/");
    return { ok: true };
  } catch (error) { return actionError(error); }
}

export async function deleteSchedule(id: string): Promise<ActionResult> {
  try {
    const profile = await requireManager();
    const parsedId = scheduleSchema.shape.id.parse(id);
    const admin = createAdminClient();
    const { data: schedule, error: readError } = await admin.from("schedules").select("*").eq("id", parsedId).single();
    if (readError) throw new Error(readError.message);
    const { error } = await admin.from("schedules").delete().eq("id", parsedId);
    if (error) throw new Error(error.message);
    await writeAudit({ profile, action: "delete", entityType: "schedule", entityId: parsedId, summary: `Deleted ${schedule.course} on ${schedule.day}`, details: { deleted: schedule } });
    revalidatePath("/");
    return { ok: true };
  } catch (error) { return actionError(error); }
}