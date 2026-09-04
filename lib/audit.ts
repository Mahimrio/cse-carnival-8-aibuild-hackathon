
import { proposerLabel } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

const DEMO_ID = "00000000-0000-0000-0000-000000000000";

export async function writeAudit({ profile, action, entityType, entityId, summary, details = {} }: { profile: Profile; action: string; entityType: string; entityId?: string | null; summary: string; details?: Record<string, unknown> }) {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_log").insert({
    actor_id: profile.id === DEMO_ID ? null : profile.id,
    actor_label: proposerLabel(profile),
    actor_role: profile.role,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    summary,
    details,
  });
  if (error) throw new Error(`The change succeeded but audit logging failed: ${error.message}`);
}