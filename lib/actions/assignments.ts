"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { actionError, requireManager, type ActionResult } from "@/lib/actions/common";
import { writeAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Assignment } from "@/lib/types";
import { assignmentSchema } from "@/lib/validations";

type AssignmentDraft = Omit<Assignment, "id">;

export async function createAssignment(input: AssignmentDraft): Promise<ActionResult> {
  try {
    const profile = await requireManager();
    const item = assignmentSchema.parse({ id: `asgn-${randomUUID().slice(0, 8)}`, ...input });
    const { error } = await createAdminClient().from("assignments").insert(item);
    if (error) throw new Error(error.message);
    await writeAudit({ profile, action: "create", entityType: "assignment", entityId: item.id, summary: `Added assignment ${item.title}` });
    revalidatePath("/"); return { ok: true };
  } catch (error) { return actionError(error); }
}

export async function updateAssignment(input: Assignment): Promise<ActionResult> {
  try {
    const profile = await requireManager();
    const item = assignmentSchema.parse(input);
    const admin = createAdminClient();
    const { data: before, error: readError } = await admin.from("assignments").select("*").eq("id", item.id).single();
    if (readError) throw new Error(readError.message);
    const { error } = await admin.from("assignments").update(item).eq("id", item.id);
    if (error) throw new Error(error.message);
    await writeAudit({ profile, action: "update", entityType: "assignment", entityId: item.id, summary: `Updated assignment ${item.title}`, details: { before, after: item } });
    revalidatePath("/"); return { ok: true };
  } catch (error) { return actionError(error); }
}

export async function deleteAssignment(id: string): Promise<ActionResult> {
  try {
    const profile = await requireManager();
    const parsedId = assignmentSchema.shape.id.parse(id);
    const admin = createAdminClient();
    const { data: item, error: readError } = await admin.from("assignments").select("*").eq("id", parsedId).single();
    if (readError) throw new Error(readError.message);
    const { error } = await admin.from("assignments").delete().eq("id", parsedId);
    if (error) throw new Error(error.message);
    await writeAudit({ profile, action: "delete", entityType: "assignment", entityId: parsedId, summary: `Deleted assignment ${item.title}`, details: { deleted: item } });
    revalidatePath("/"); return { ok: true };
  } catch (error) { return actionError(error); }
}