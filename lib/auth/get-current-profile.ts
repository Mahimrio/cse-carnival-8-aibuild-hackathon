import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

const demoProfile: Profile = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "demo-admin@campusos.local",
  full_name: "Demo Super Admin",
  role: "super_admin",
  requested_role: "student",
  status: "active",
  section: null,
  semester: null,
  year: null,
  created_at: new Date(0).toISOString(),
};

export async function getCurrentProfile(): Promise<Profile | null> {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return demoProfile;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data, error } = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw new Error(`Unable to load profile: ${error.message}`);
  return data as Profile | null;
}