import { Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/domain-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/section-header";
import type { Event } from "@/lib/types";

export function EventsView({ events }: { events: Event[] }) {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  return <div><SectionHeader title="Events" description={`${events.length} events · ${events.filter((event) => event.status === "upcoming").length} upcoming`} className="mb-4" />{sorted.length === 0 ? <EmptyState title="No events" description="No events are scheduled yet." /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{sorted.map((event) => { const percentage = Math.round((event.registered / event.capacity) * 100); return <Card key={event.id} hoverable className="flex flex-col"><CardContent className="flex-1 pt-5"><div className="mb-2"><StatusBadge status={event.status} /></div><h3 className="mb-1 font-heading text-sm font-semibold leading-snug">{event.name}</h3><p className="mb-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{event.description}</p><div className="mb-3 flex flex-col gap-1.5"><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar aria-hidden="true" size={11} />{event.date}{event.end_date !== event.date ? ` to ${event.end_date}` : ""} · {event.start_time}-{event.end_time}</span><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin aria-hidden="true" size={11} />{event.venue}</span><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users aria-hidden="true" size={11} />{event.organizer}</span></div><Progress value={percentage} className="mb-1" /><p className="text-xs text-muted-foreground">{event.registered}/{event.capacity} registered</p></CardContent></Card>; })}</div>}</div>;
}