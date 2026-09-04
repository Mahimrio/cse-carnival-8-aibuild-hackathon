"use client";

import { BookOpen, Layers, Users } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EquipmentPill, StatusBadge } from "@/components/ui/domain-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import type { Room } from "@/lib/types";
import { cn } from "@/lib/utils";

const labels = { classroom: "Classroom", lab: "Lab", seminar: "Seminar Hall" };

export function RoomsView({ rooms }: { rooms: Room[] }) {
  const [filter, setFilter] = useState<"all" | Room["type"]>("all");
  const filtered = rooms.filter((room) => filter === "all" || room.type === filter);
  return <div><SectionHeader title="Rooms" description={`${rooms.length} rooms · ${rooms.filter((room) => room.status === "available").length} available`} className="mb-4" /><div className="mb-4 flex gap-2 overflow-x-auto pb-1">{(["all", "classroom", "lab", "seminar"] as const).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={cn("whitespace-nowrap rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700", filter === value && "bg-primary text-primary-foreground hover:bg-primary dark:hover:bg-primary")}>{value === "all" ? "All Rooms" : labels[value]} <span className="ml-1 text-xs opacity-70">{value === "all" ? rooms.length : rooms.filter((room) => room.type === value).length}</span></button>)}</div>{filtered.length === 0 ? <EmptyState title="No rooms" description="No rooms match this filter." icon={<Layers size={22} />} /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((room) => <Card key={room.id} hoverable><CardContent className="pt-5"><div className="mb-3 flex items-start justify-between gap-2"><div><h3 className="font-heading text-lg font-semibold">{room.room_number}</h3><p className="text-xs text-muted-foreground">{labels[room.type]} · Floor {room.floor}</p></div><StatusBadge status={room.status} /></div><p className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground"><Users aria-hidden="true" size={13} />Capacity {room.capacity}</p><div className="mb-3 flex min-h-6 flex-wrap gap-1">{room.equipment.slice(0, 3).map((item) => <EquipmentPill key={item}>{item}</EquipmentPill>)}{room.equipment.length > 3 && <EquipmentPill>+{room.equipment.length - 3}</EquipmentPill>}</div><p className="flex items-center gap-1 text-xs text-muted-foreground"><BookOpen aria-hidden="true" size={11} />{room.bookings.length} booking{room.bookings.length === 1 ? "" : "s"}</p></CardContent></Card>)}</div>}</div>;
}