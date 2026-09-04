"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { actionError, requireManager, type ActionResult } from "@/lib/actions/common";
import { writeAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Announcement } from "@/lib/types";
import { announcementSchema } from "@/lib/validations";

type AnnouncementDraft = Omit<Announcement, "id">;

export async function createAnnouncement(input: AnnouncementDraft): Promise<ActionResult> {
  try {
    const profile = await requireManager();
    const item = announcementSchema.parse({ id: `ann-${randomUUID().slice(0, 8)}`, ...input });
    const { error } = await createAdminClient().from("announcements").insert(item);
    if (error) throw new Error(error.message);
    await writeAudit({ profile, action: "create", entityType: "announcement", entityId: item.id, summary: `Posted announcement ${item.title}` });
    revalidatePath("/"); return { ok: true };
  } catch (error) { return actionError(error); }
}

export async function updateAnnouncement(input: Announcement): Promise<ActionResult> {
  try {
    const profile = await requireManager();
    const item = announcementSchema.parse(input);
    const admin = createAdminClient();
    const { data: before, error: readError } = await admin.from("announcements").select("*").eq("id", item.id).single();
    if (readError) throw new Error(readError.message);
    const { error } = await admin.from("announcements").update(item).eq("id", item.id);
    if (error) throw new Error(error.message);
    await writeAudit({ profile, action: "update", entityType: "announcement", entityId: item.id, summary: `Updated announcement ${item.title}`, details: { before, after: item } });
    revalidatePath("/"); return { ok: true };
  } catch (error) { return actionError(error); }
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  try {
    const profile = await requireManager();
    const parsedId = announcementSchema.shape.id.parse(id);
    const admin = createAdminClient();
    const { data: item, error: readError } = await admin.from("announcements").select("*").eq("id", parsedId).single();
    if (readError) throw new Error(readError.message);
    const { error } = await admin.from("announcements").delete().eq("id", parsedId);
    if (error) throw new Error(error.message);
    await writeAudit({ profile, action: "delete", entityType: "announcement", entityId: parsedId, summary: `Deleted announcement ${item.title}`, details: { deleted: item } });
    revalidatePath("/"); return { ok: true };
  } catch (error) { return actionError(error); }
}