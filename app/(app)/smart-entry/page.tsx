import { redirect } from "next/navigation";
import { SmartEntryPanel } from "@/components/smart-entry/smart-entry-panel";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { isManager } from "@/lib/auth/roles";
import { getPendingChanges } from "@/lib/data/pending-changes";

export default async function SmartEntryPage() {
  const profile = await getCurrentProfile();
  if (!profile || !isManager(profile.role)) redirect("/");
  const changes = await getPendingChanges();
  return <SmartEntryPanel changes={changes} />;
}