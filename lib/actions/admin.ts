"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { isAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/types";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) throw new Error("Only a super admin can manage accounts.");
}

async function updateProfile(userId: string, values: Record<string, string>) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update(values).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function approveUser(userId: string, role: UserRole) {
  return updateProfile(userId, { role, status: "active" });
}

export async function rejectUser(userId: string) {
  return updateProfile(userId, { status: "rejected" });
}

export async function updateUserRole(userId: string, role: UserRole) {
  return updateProfile(userId, { role });
}