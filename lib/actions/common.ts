
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { isManager } from "@/lib/auth/roles";
import type { Profile } from "@/lib/types";

export type ActionResult<T = undefined> = T extends undefined
  ? { ok: true } | { ok: false; error: string }
  : { ok: true; data: T } | { ok: false; error: string };

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active") throw new Error("You must be signed in with an active account.");
  return profile;
}

export async function requireManager(): Promise<Profile> {
  const profile = await requireProfile();
  if (!isManager(profile.role)) throw new Error("Only a data manager can change campus records.");
  return profile;
}

export function actionError(error: unknown): ActionResult {
  return { ok: false, error: error instanceof Error ? error.message : "The operation failed." };
}