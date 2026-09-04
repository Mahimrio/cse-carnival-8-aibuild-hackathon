import { notFound } from "next/navigation";
import { AdminPanel } from "@/components/admin/admin-panel";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { isAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

export default async function AdminPage() {
  const current = await getCurrentProfile();
  if (!current || !isAdmin(current.role)) notFound();
  const admin = createAdminClient();
  const { data, error } = await admin.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load profiles: ${error.message}`);
  return <AdminPanel profiles={(data ?? []) as Profile[]} currentUserId={current.id} />;
}