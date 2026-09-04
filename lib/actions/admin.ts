"use server";

import { revalidatePath } from "next/cache";
import { writeAudit } from "@/lib/audit";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { roleName } from "@/lib/auth/roles";
import { isAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/types";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) throw new Error("Only a super admin can manage accounts.");
  return profile;
}

async function updateProfile(userId: string, values: Record<string, string>, action: string, summary: (name: string) => string) {
  const profile = await requireAdmin();
  const admin = createAdminClient();
  const { data: target, error: readError } = await admin.from("profiles").select("full_name,email,role,status").eq("id", userId).single();
  if (readError) throw new Error(readError.message);
  const { error } = await admin.from("profiles").update(values).eq("id", userId);
  if (error) throw new Error(error.message);
  await writeAudit({ profile, action, entityType: "user", entityId: userId, summary: summary(target.full_name || target.email), details: { before: target, changes: values } });
  revalidatePath("/admin");
  revalidatePath("/history");
}

export async function approveUser(userId: string, role: UserRole) {
  return updateProfile(userId, { role, status: "active" }, "approve", (name) => `Approved ${name} as ${roleName(role)}`);
}

export async function rejectUser(userId: string) {
  return updateProfile(userId, { status: "rejected" }, "reject", (name) => `Rejected account request for ${name}`);
}

export async function updateUserRole(userId: string, role: UserRole) {
  return updateProfile(userId, { role }, "update", (name) => `Changed ${name}'s role to ${roleName(role)}`);
}