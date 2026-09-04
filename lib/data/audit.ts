import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditLog } from "@/lib/types";

export async function getAuditLog(limit = 200): Promise<AuditLog[]> {
  const { data, error } = await createAdminClient()
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Unable to load audit history: ${error.message}`);
  return (data ?? []) as AuditLog[];
}