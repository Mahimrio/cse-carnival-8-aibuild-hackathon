import { Camera } from "lucide-react";
import { redirect } from "next/navigation";
import { DestinationShell } from "@/components/layout/destination-shell";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { isManager } from "@/lib/auth/roles";

export default async function SmartEntryPage() {
  const profile = await getCurrentProfile();
  if (!profile || !isManager(profile.role)) redirect("/");
  return <DestinationShell title="Smart Entry" description="Review AI-assisted campus data proposals" emptyTitle="No pending proposals" emptyDescription="Uploaded routine and notice proposals will appear here for review." icon={Camera} />;
}