import { isManager } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types";

export function ManagerOnly({ role, children }: { role: UserRole; children: React.ReactNode }) {
  return isManager(role) ? children : null;
}