import type { EntityType } from "@/lib/types";

export const entityLabels: Record<EntityType, string> = {
  schedule: "Schedule",
  room: "Room",
  event: "Event",
  announcement: "Announcement",
  assignment: "Assignment",
  user: "User",
};

export function formatAuditAction(action: string) {
  return action.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export function auditActionColor(action: string) {
  if (["create", "approve", "register"].includes(action)) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  if (["delete", "reject"].includes(action)) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (["book", "smart_entry_accept"].includes(action)) return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300";
  if (["cancel_booking", "cancel_registration"].includes(action)) return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
  return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
}