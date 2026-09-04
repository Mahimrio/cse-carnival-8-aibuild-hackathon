import { Clock } from "lucide-react";
import { HistoryTimeline } from "@/components/history/history-timeline";
import { getAuditLog } from "@/lib/data/audit";

export default async function HistoryPage() {
  const entries = await getAuditLog();
  return <div><div className="mb-6"><h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><Clock aria-hidden="true" className="text-primary" size={22} />Audit History</h1><p className="mt-1 text-sm text-muted-foreground">{entries.length} total entries · public campus trail</p></div><HistoryTimeline entries={entries} /></div>;
}