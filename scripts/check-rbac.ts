import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publicKey || !serviceKey) throw new Error("Supabase environment variables are required.");

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const email = `rbac-check-${Date.now()}@campusos.local`;
  const password = `Test-${randomUUID()}`;
  let userId: string | undefined;

  try {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "RBAC Check", requested_role: "cr", section: "B", semester: "8", year: "4" },
    });
    if (createError) throw createError;
    userId = created.user.id;

    const { data: pending, error: profileError } = await admin.from("profiles").select("role,requested_role,status").eq("id", userId).single();
    if (profileError) throw profileError;
    if (pending.role !== "student" || pending.requested_role !== "cr" || pending.status !== "pending") {
      throw new Error("Signup trigger did not create the expected pending CR request.");
    }
    console.log("PASS signup trigger: pending student with CR request");

    const { error: approveError } = await admin.from("profiles").update({ role: "cr", status: "active" }).eq("id", userId);
    if (approveError) throw approveError;

    const publicClient = createClient(url, publicKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: login, error: loginError } = await publicClient.auth.signInWithPassword({ email, password });
    if (loginError || !login.user) throw loginError ?? new Error("Approved user could not sign in.");
    console.log("PASS approval and authenticated sign-in");

    const { data: ownProfile, error: ownProfileError } = await publicClient.from("profiles").select("id,role,status").eq("id", userId).single();
    if (ownProfileError || ownProfile.role !== "cr" || ownProfile.status !== "active") {
      throw ownProfileError ?? new Error("Approved user could not read their own active profile.");
    }
    console.log("PASS authenticated own-profile RLS read");
  } finally {
    if (userId) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) console.error(`Cleanup warning: ${error.message}`);
      else console.log("PASS disposable user cleanup");
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});