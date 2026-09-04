"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface AuthState { error?: string; }

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const signupSchema = loginSchema.extend({
  full_name: z.string().trim().min(2, "Enter your full name."),
  requested_role: z.enum(["student", "cr", "sr"]),
  section: z.string().trim().max(20),
  semester: z.string().trim().max(20),
  year: z.string().trim().max(20),
});

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return { error: "Your profile is missing. Contact a CampusOS administrator." };
  }
  if (profile.status === "rejected") {
    await supabase.auth.signOut();
    return { error: "This account request was rejected. Contact an administrator." };
  }
  redirect(profile.status === "active" ? "/" : "/pending");
}

export async function signupAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { email, password, ...metadata } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  if (error) return { error: error.message };
  if (!data.session) {
    return { error: "Account created. Confirm your email, then sign in to await approval." };
  }
  redirect("/pending");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}