import { History } from "lucide-react";
import { DestinationShell } from "@/components/layout/destination-shell";

export default function HistoryPage() {
  return <DestinationShell title="History" description="Campus activity in chronological order" emptyTitle="No activity yet" emptyDescription="Campus changes will appear here as they happen." icon={History} />;
}