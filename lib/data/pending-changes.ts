import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { PendingChange } from "@/lib/types";

export async function getPendingChanges(): Promise<PendingChange[]> {
  const { data, error } = await createAdminClient().from("pending_changes").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error(`Unable to load Smart Entry proposals: ${error.message}`);
  return (data ?? []) as PendingChange[];
}