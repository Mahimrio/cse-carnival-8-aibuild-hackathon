"use client";

import { Calendar, MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { ManagerOnly } from "@/components/auth/manager-only";
import { EntityFormDialog, type EntityField } from "@/components/systems/entity-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/domain-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/section-header";
import { useServerAction } from "@/hooks/use-server-action";
import { cancelEventRegistration, createEvent, deleteEvent, registerForEvent, updateEvent } from "@/lib/actions/events";
import type { Event, Profile } from "@/lib/types";

const eventFields: EntityField[] = [
  { name: "name", label: "Event name", required: true, full: true },
  { name: "description", label: "Description", type: "textarea", required: true, full: true },
  { name: "date", label: "Start date", type: "date", required: true },
  { name: "end_date", label: "End date", type: "date", required: true },
  { name: "start_time", label: "Start time", type: "time", required: true },
  { name: "end_time", label: "End time", type: "time", required: true },
  { name: "venue", label: "Venue", required: true },
  { name: "capacity", label: "Capacity", type: "number", required: true },
  { name: "organizer", label: "Organizer", required: true },
  { name: "status", label: "Status", type: "select", options: ["upcoming", "ongoing", "completed", "cancelled", "full"].map((value) => ({ value, label: value })) },
];
const emptyEvent = { name: "", description: "", date: "", end_date: "", start_time: "", end_time: "", venue: "", organizer: "", capacity: 60, status: "upcoming" };

export function EventsView({ events, profile }: { events: Event[]; profile: Profile }) {
  const [editing, setEditing] = useState<Event | "new" | null>(null);
  const [deleting, setDeleting] = useState<Event | null>(null);
  const { pending, run } = useServerAction();
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const save = (values: Record<string, string>) => {
    const draft = { name: values.name, description: values.description, date: values.date, end_date: values.end_date, start_time: values.start_time, end_time: values.end_time, venue: values.venue, organizer: values.organizer, capacity: Number(values.capacity), status: values.status as Event["status"] };
    return editing === "new" ? createEvent(draft) : updateEvent({ ...editing!, ...draft } as Event);
  };
  return <div><SectionHeader title="Events" description={`${events.length} events · ${events.filter((event) => event.status === "upcoming").length} upcoming`} className="mb-4" action={<ManagerOnly role={profile.role}><Button size="sm" onClick={() => setEditing("new")}><Plus size={14} />Add Event</Button></ManagerOnly>} />{sorted.length === 0 ? <EmptyState title="No events" description="No events are scheduled yet." /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{sorted.map((event) => { const percentage = Math.round((event.registered / event.capacity) * 100); const registered = event.registrations.some((item) => item.student_id === profile.id); return <Card key={event.id} className="group flex flex-col"><CardContent className="flex-1 pt-5"><div className="mb-2 flex items-start justify-between"><StatusBadge status={event.status} /><ManagerOnly role={profile.role}><div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100"><button onClick={() => setEditing(event)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Edit ${event.name}`}><Pencil size={13} /></button><button onClick={() => setDeleting(event)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-600" aria-label={`Delete ${event.name}`}><Trash2 size={13} /></button></div></ManagerOnly></div><h3 className="mb-1 font-heading text-sm font-semibold leading-snug">{event.name}</h3><p className="mb-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{event.description}</p><div className="mb-3 flex flex-col gap-1.5"><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar size={11} />{event.date}{event.end_date !== event.date ? ` to ${event.end_date}` : ""} · {event.start_time}-{event.end_time}</span><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin size={11} />{event.venue}</span><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users size={11} />{event.organizer}</span></div><Progress value={percentage} className="mb-1" /><p className="text-xs text-muted-foreground">{event.registered}/{event.capacity} registered</p></CardContent><CardFooter><Button size="sm" variant={registered ? "secondary" : "primary"} className="w-full" disabled={pending || (!registered && ["full", "cancelled", "completed"].includes(event.status))} onClick={() => run(() => registered ? cancelEventRegistration(event.id) : registerForEvent(event.id), registered ? "Registration cancelled." : "Registered successfully.")}>{registered ? "Cancel Registration" : event.status === "full" ? "Event Full" : "Register"}</Button></CardFooter></Card>; })}</div>}<EntityFormDialog open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add Event" : "Edit Event"} fields={eventFields} initial={editing && editing !== "new" ? editing : emptyEvent} onSubmit={save} successMessage={editing === "new" ? "Event added." : "Event updated."} /><ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleting && run(() => deleteEvent(deleting.id), "Event deleted.", () => setDeleting(null))} title="Delete Event" description={`Delete ${deleting?.name ?? "this event"}? This cannot be undone.`} loading={pending} /></div>;
}