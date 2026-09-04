"use client";

import { BookOpen, Layers, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import { useState } from "react";
import { ManagerOnly } from "@/components/auth/manager-only";
import { EntityFormDialog, type EntityField } from "@/components/systems/entity-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EquipmentPill, StatusBadge } from "@/components/ui/domain-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { useServerAction } from "@/hooks/use-server-action";
import { bookRoom, cancelRoomBooking, createRoom, deleteRoom, updateRoom } from "@/lib/actions/rooms";
import type { Profile, Room } from "@/lib/types";
import { cn } from "@/lib/utils";

const labels = { classroom: "Classroom", lab: "Lab", seminar: "Seminar Hall" };
const roomFields: EntityField[] = [
  { name: "room_number", label: "Room number", required: true, placeholder: "7A01" },
  { name: "type", label: "Type", type: "select", options: Object.entries(labels).map(([value, label]) => ({ value, label })) },
  { name: "capacity", label: "Capacity", type: "number", required: true },
  { name: "floor", label: "Floor", type: "number", required: true },
  { name: "equipment", label: "Equipment", placeholder: "projector, AC, whiteboard", full: true },
  { name: "status", label: "Status", type: "select", options: [{ value: "available", label: "Available" }, { value: "unavailable", label: "Unavailable" }] },
];
const bookingFields: EntityField[] = [
  { name: "date", label: "Date", type: "date", required: true },
  { name: "start_time", label: "Start time", type: "time", required: true },
  { name: "end_time", label: "End time", type: "time", required: true },
  { name: "purpose", label: "Purpose", required: true, full: true },
];
const emptyRoom = { room_number: "", type: "classroom", capacity: 40, floor: 7, equipment: "", status: "available" };

export function RoomsView({ rooms, profile, today }: { rooms: Room[]; profile: Profile; today: string }) {
  const [filter, setFilter] = useState<"all" | Room["type"]>("all");
  const [editing, setEditing] = useState<Room | "new" | null>(null);
  const [deleting, setDeleting] = useState<Room | null>(null);
  const [booking, setBooking] = useState<Room | null>(null);
  const { pending, run } = useServerAction();
  const filtered = rooms.filter((room) => filter === "all" || room.type === filter);
  const roomInitial = editing && editing !== "new" ? { ...editing, equipment: editing.equipment.join(", ") } : emptyRoom;
  const saveRoom = (values: Record<string, string>) => {
    const draft = { room_number: values.room_number, type: values.type as Room["type"], capacity: Number(values.capacity), floor: Number(values.floor), equipment: values.equipment.split(",").map((item) => item.trim()).filter(Boolean), status: values.status as Room["status"] };
    return editing === "new" ? createRoom(draft) : updateRoom({ ...editing!, ...draft } as Room);
  };
  const saveBooking = (values: Record<string, string>) => bookRoom(booking!.id, { date: values.date, start_time: values.start_time, end_time: values.end_time, purpose: values.purpose });

  return <div><SectionHeader title="Rooms" description={`${rooms.length} rooms · ${rooms.filter((room) => room.status === "available").length} available`} className="mb-4" action={<ManagerOnly role={profile.role}><Button size="sm" onClick={() => setEditing("new")}><Plus size={14} />Add Room</Button></ManagerOnly>} /><div className="mb-4 flex gap-2 overflow-x-auto pb-1">{(["all", "classroom", "lab", "seminar"] as const).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={cn("whitespace-nowrap rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700", filter === value && "bg-primary text-primary-foreground hover:bg-primary dark:hover:bg-primary")}>{value === "all" ? "All Rooms" : labels[value]} <span className="ml-1 text-xs opacity-70">{value === "all" ? rooms.length : rooms.filter((room) => room.type === value).length}</span></button>)}</div>{filtered.length === 0 ? <EmptyState title="No rooms" description="No rooms match this filter." icon={<Layers size={22} />} /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((room) => <Card key={room.id} className="group flex flex-col"><CardContent className="flex-1 pt-5"><div className="mb-3 flex items-start justify-between gap-2"><div><h3 className="font-heading text-lg font-semibold">{room.room_number}</h3><p className="text-xs text-muted-foreground">{labels[room.type]} · Floor {room.floor}</p></div><StatusBadge status={room.status} /></div><p className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground"><Users size={13} />Capacity {room.capacity}</p><div className="mb-3 flex min-h-6 flex-wrap gap-1">{room.equipment.slice(0, 3).map((item) => <EquipmentPill key={item}>{item}</EquipmentPill>)}{room.equipment.length > 3 && <EquipmentPill>+{room.equipment.length - 3}</EquipmentPill>}</div>{room.bookings.length > 0 && <div><p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground"><BookOpen size={11} />Bookings ({room.bookings.length})</p>{room.bookings.map((item) => <div key={item.booking_id} className="mb-1 flex items-center justify-between rounded-lg bg-muted px-2 py-1.5 text-xs"><span><strong>{item.date}</strong> · {item.start_time}-{item.end_time}</span><button type="button" onClick={() => run(() => cancelRoomBooking(room.id, item.booking_id), "Booking cancelled.")} disabled={pending} className="text-muted-foreground hover:text-red-600" aria-label={`Cancel booking ${item.booking_id}`}><X size={12} /></button></div>)}</div>}</CardContent><CardFooter className="gap-2"><Button size="sm" variant="outline" className="flex-1" onClick={() => setBooking(room)} disabled={room.status !== "available"}>Book</Button><ManagerOnly role={profile.role}><button type="button" onClick={() => setEditing(room)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Edit ${room.room_number}`}><Pencil size={14} /></button><button type="button" onClick={() => setDeleting(room)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-red-600" aria-label={`Delete ${room.room_number}`}><Trash2 size={14} /></button></ManagerOnly></CardFooter></Card>)}</div>}<EntityFormDialog open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add Room" : "Edit Room"} fields={roomFields} initial={roomInitial} onSubmit={saveRoom} successMessage={editing === "new" ? "Room added." : "Room updated."} /><EntityFormDialog open={!!booking} onClose={() => setBooking(null)} title={`Book Room ${booking?.room_number ?? ""}`} submitLabel="Confirm Booking" fields={bookingFields} initial={{ date: today, start_time: "", end_time: "", purpose: "" }} onSubmit={saveBooking} successMessage="Room booked." /><ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleting && run(() => deleteRoom(deleting.id), "Room deleted.", () => setDeleting(null))} title="Delete Room" description={`Delete room ${deleting?.room_number ?? ""}? This cannot be undone.`} loading={pending} /></div>;
}