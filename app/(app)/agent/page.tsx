import { Bot } from "lucide-react";
import { DestinationShell } from "@/components/layout/destination-shell";

export default function AgentPage() {
  return <DestinationShell title="Ask CampusOS" description="Your role-aware campus assistant" emptyTitle="Start a conversation" emptyDescription="CampusOS is preparing the live data tools for your session." icon={Bot} showSkeleton />;
}