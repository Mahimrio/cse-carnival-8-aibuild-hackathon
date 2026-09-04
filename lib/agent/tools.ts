import { Type } from "@google/genai";
import { bookRoom, cancelRoomBooking } from "@/lib/actions/rooms";
import { registerForEvent, cancelEventRegistration } from "@/lib/actions/events";
import { getNow, getToday, getTomorrow, getWeekRange } from "@/lib/now";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, Room, Event, Schedule, Assignment, Announcement } from "@/lib/types";

export const agentToolsDeclaration = [
  {
    functionDeclarations: [
      {
        name: "get_current_datetime",
        description: "Returns exact current date (YYYY-MM-DD), time (HH:MM), day of the week, tomorrow's date, and this week's date range.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "get_schedules",
        description: "Fetches class schedules. Call this when asked about timetable, classes on a day (e.g. Wednesday), course schedules, or student free time slots.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.STRING, description: "Day of the week (e.g. Sunday, Monday, Tuesday, Wednesday, Thursday)" },
            course: { type: Type.STRING, description: "Course code or title (e.g. CSE321)" },
          },
        },
      },
      {
        name: "get_next_class",
        description: "Finds the user's next upcoming class based on current date, day of week, and time.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "get_assignments",
        description: "Fetches assignments. Call this for queries about assignments due, deadlines, submission status, or marks.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, description: "Status filter: pending, submitted, graded, late" },
            due_before: { type: Type.STRING, description: "Date YYYY-MM-DD to filter assignments due on or before" },
          },
        },
      },
      {
        name: "get_announcements",
        description: "Fetches campus notices and announcements. Call this when asked about notices or announcements (e.g. high priority).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            priority: { type: Type.STRING, description: "Priority filter: high, medium, low" },
          },
        },
      },
      {
        name: "get_events",
        description: "Fetches campus events (workshops, lectures, seminars). Call this when asked about events, drop-in activities, or free-time activities.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, description: "Status filter: upcoming, ongoing, completed, cancelled, full" },
          },
        },
      },
      {
        name: "get_rooms",
        description: "Fetches campus room details (capacity, equipment like projector, type like lab/classroom).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            min_capacity: { type: Type.NUMBER, description: "Minimum capacity required" },
            equipment: { type: Type.STRING, description: "Required equipment tag (e.g. projector, computers, white board)" },
            type: { type: Type.STRING, description: "Room type: classroom, lab, seminar" },
          },
        },
      },
      {
        name: "check_room_availability",
        description: "Checks if a specific room (e.g. '7A02') is available at a given date and time range.",
        parameters: {
          type: Type.OBJECT,
          required: ["room_number", "date", "start_time", "end_time"],
          properties: {
            room_number: { type: Type.STRING, description: "Room number like '7A02'" },
            date: { type: Type.STRING, description: "Date YYYY-MM-DD" },
            start_time: { type: Type.STRING, description: "Start time HH:MM (e.g. 15:00)" },
            end_time: { type: Type.STRING, description: "End time HH:MM (e.g. 17:00)" },
          },
        },
      },
      {
        name: "find_available_rooms",
        description: "Finds available rooms matching criteria (capacity, equipment, type) for a specific date and time range.",
        parameters: {
          type: Type.OBJECT,
          required: ["date", "start_time", "end_time"],
          properties: {
            date: { type: Type.STRING, description: "Date YYYY-MM-DD" },
            start_time: { type: Type.STRING, description: "Start time HH:MM" },
            end_time: { type: Type.STRING, description: "End time HH:MM" },
            min_capacity: { type: Type.NUMBER, description: "Minimum capacity required" },
            equipment: { type: Type.STRING, description: "Required equipment (e.g. projector)" },
            type: { type: Type.STRING, description: "Room type: classroom, lab, seminar" },
          },
        },
      },
      {
        name: "book_room",
        description: "Books a room. ONLY call when explicit room number, date, start_time, end_time, and purpose are specified. DO NOT call if request is vague.",
        parameters: {
          type: Type.OBJECT,
          required: ["room_number", "date", "start_time", "end_time", "purpose"],
          properties: {
            room_number: { type: Type.STRING, description: "Room number like '7A02' or room ID" },
            date: { type: Type.STRING, description: "Date YYYY-MM-DD" },
            start_time: { type: Type.STRING, description: "Start time HH:MM (e.g. 15:00)" },
            end_time: { type: Type.STRING, description: "End time HH:MM (e.g. 17:00)" },
            purpose: { type: Type.STRING, description: "Purpose of booking" },
          },
        },
      },
      {
        name: "cancel_room_booking",
        description: "Cancels an existing room booking by room_number and booking_id.",
        parameters: {
          type: Type.OBJECT,
          required: ["room_number", "booking_id"],
          properties: {
            room_number: { type: Type.STRING, description: "Room number or room ID" },
            booking_id: { type: Type.STRING, description: "Booking ID (e.g. bk-xxxx)" },
          },
        },
      },
      {
        name: "register_for_event",
        description: "Registers current user for a campus event by event name or ID.",
        parameters: {
          type: Type.OBJECT,
          required: ["event_name_or_id"],
          properties: {
            event_name_or_id: { type: Type.STRING, description: "Event ID or Event name (e.g. 'Guest Lecture on Deep Learning')" },
          },
        },
      },
      {
        name: "cancel_event_registration",
        description: "Cancels current user's registration for a campus event by event name or ID.",
        parameters: {
          type: Type.OBJECT,
          required: ["event_id_or_name"],
          properties: {
            event_id_or_name: { type: Type.STRING, description: "Event ID or Event name" },
          },
        },
      },
    ],
  },
];

export function normalizeTime(t: string): string {
  if (!t) return "";
  const clean = t.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2] || "00";
    const period = match[3];

    if (period === "PM" && hours < 12) hours += 12;
    else if (period === "AM" && hours === 12) hours = 0;
    else if (!period) {
      if (hours >= 1 && hours <= 7) hours += 12;
    }
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }
  return clean;
}

function findRoom(rooms: Room[], query: string): Room | undefined {
  const clean = query.replace(/^room\s*/i, "").trim().toLowerCase();
  return rooms.find(
    (r) => r.room_number.toLowerCase() === clean || r.id.toLowerCase() === clean || r.id.toLowerCase() === `room-${clean}`
  );
}

function findEvent(events: Event[], query: string): Event | undefined {
  const clean = query.trim().toLowerCase();
  return events.find(
    (e) => e.id.toLowerCase() === clean || e.name.toLowerCase().includes(clean) || clean.includes(e.name.toLowerCase())
  );
}

export async function executeAgentTool(name: string, args: Record<string, unknown>, callerProfile?: Profile): Promise<unknown> {
  const admin = createAdminClient();

  switch (name) {
    case "get_current_datetime": {
      const now = getNow();
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const weekRange = getWeekRange();
      return {
        current_date: getToday(),
        current_time: now.toTimeString().slice(0, 8),
        day_of_week: days[now.getDay()],
        tomorrow_date: getTomorrow(),
        this_week_range: `${weekRange.start} to ${weekRange.end}`,
      };
    }

    case "get_schedules": {
      const { data, error } = await admin.from("schedules").select("*");
      if (error) return { error: error.message };
      let list = (data || []) as Schedule[];
      if (args.day) {
        const d = String(args.day).toLowerCase();
        list = list.filter((s) => s.day.toLowerCase().includes(d));
      }
      if (args.course) {
        const c = String(args.course).toLowerCase();
        list = list.filter((s) => s.course.toLowerCase().includes(c) || s.title.toLowerCase().includes(c));
      }
      if (list.length === 0) {
        return { count: 0, message: "No class schedules found matching your query." };
      }
      return list;
    }

    case "get_next_class": {
      const { data, error } = await admin.from("schedules").select("*");
      if (error) return { error: error.message };
      const schedules = (data || []) as Schedule[];
      const now = getNow();
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const currentDay = days[now.getDay()];
      const currentTime = now.toTimeString().slice(0, 5);

      const activeDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
      
      const todayClasses = schedules
        .filter((s) => s.day.toLowerCase() === currentDay.toLowerCase() && s.start_time >= currentTime)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      if (todayClasses.length > 0) {
        return { next_class: todayClasses[0], is_today: true };
      }

      const currentDayIdx = activeDays.indexOf(currentDay);
      for (let i = 1; i <= 7; i++) {
        const nextDay = activeDays[(currentDayIdx + i) % activeDays.length];
        const nextDayClasses = schedules
          .filter((s) => s.day.toLowerCase() === nextDay.toLowerCase())
          .sort((a, b) => a.start_time.localeCompare(b.start_time));
        if (nextDayClasses.length > 0) {
          return { next_class: nextDayClasses[0], is_today: false, day: nextDay };
        }
      }
      return { next_class: null, message: "No upcoming classes found." };
    }

    case "get_assignments": {
      const { data, error } = await admin.from("assignments").select("*").order("deadline", { ascending: true });
      if (error) return { error: error.message };
      let list = (data || []) as Assignment[];
      if (args.status) {
        list = list.filter((a) => a.status.toLowerCase() === String(args.status).toLowerCase());
      }
      if (args.due_before) {
        list = list.filter((a) => a.deadline.slice(0, 10) <= String(args.due_before));
      }
      if (list.length === 0) {
        return { count: 0, message: "No assignments found matching the criteria." };
      }
      return list;
    }

    case "get_announcements": {
      const { data, error } = await admin.from("announcements").select("*").order("date", { ascending: false });
      if (error) return { error: error.message };
      let list = (data || []) as Announcement[];
      if (args.priority) {
        list = list.filter((a) => a.priority.toLowerCase() === String(args.priority).toLowerCase());
      }
      if (list.length === 0) {
        return { count: 0, message: "No announcements found matching your filter." };
      }
      return list;
    }

    case "get_events": {
      const { data, error } = await admin.from("events").select("*").order("date", { ascending: true });
      if (error) return { error: error.message };
      let list = (data || []) as Event[];
      if (args.status) {
        list = list.filter((e) => e.status.toLowerCase() === String(args.status).toLowerCase());
      }
      if (list.length === 0) {
        return { count: 0, message: "No events found matching your query." };
      }
      return list;
    }

    case "get_rooms": {
      const { data, error } = await admin.from("rooms").select("*");
      if (error) return { error: error.message };
      let list = (data || []) as Room[];
      if (args.type) {
        const t = String(args.type).toLowerCase();
        list = list.filter((r) => r.type.toLowerCase() === t);
      }
      if (args.min_capacity) {
        const cap = Number(args.min_capacity);
        list = list.filter((r) => r.capacity >= cap);
      }
      if (args.equipment) {
        const eq = String(args.equipment).toLowerCase();
        list = list.filter((r) => r.equipment.some((item) => item.toLowerCase().includes(eq)));
      }
      if (list.length === 0) {
        return { count: 0, message: "No rooms found matching the specified filters (type, equipment, capacity)." };
      }
      return list;
    }

    case "check_room_availability": {
      const roomNum = String(args.room_number || "").trim();
      const date = String(args.date || "").trim();
      const startTime = normalizeTime(String(args.start_time || ""));
      const endTime = normalizeTime(String(args.end_time || ""));

      const { data, error } = await admin.from("rooms").select("*");
      if (error) return { error: error.message };
      const rooms = (data || []) as Room[];
      const room = findRoom(rooms, roomNum);

      if (!room) return { available: false, reason: `Room '${roomNum}' not found.` };
      if (room.status !== "available") return { available: false, reason: `Room ${room.room_number} is out of service.` };

      const conflict = room.bookings.find(
        (b) => b.date === date && startTime < b.end_time && endTime > b.start_time
      );
      if (conflict) {
        return { available: false, room_number: room.room_number, date, conflict };
      }
      return { available: true, room_number: room.room_number, date, start_time: startTime, end_time: endTime };
    }

    case "find_available_rooms": {
      const date = String(args.date || "").trim();
      const startTime = normalizeTime(String(args.start_time || ""));
      const endTime = normalizeTime(String(args.end_time || ""));

      const { data, error } = await admin.from("rooms").select("*");
      if (error) return { error: error.message };
      let rooms = (data || []) as Room[];

      rooms = rooms.filter((r) => r.status === "available");
      if (args.type) {
        const t = String(args.type).toLowerCase();
        rooms = rooms.filter((r) => r.type.toLowerCase() === t);
      }
      if (args.min_capacity) {
        const cap = Number(args.min_capacity);
        rooms = rooms.filter((r) => r.capacity >= cap);
      }
      if (args.equipment) {
        const eq = String(args.equipment).toLowerCase();
        rooms = rooms.filter((r) => r.equipment.some((item) => item.toLowerCase().includes(eq)));
      }

      const availableRooms = rooms.filter((r) => {
        const conflict = r.bookings.find(
          (b) => b.date === date && startTime < b.end_time && endTime > b.start_time
        );
        return !conflict;
      });

      if (availableRooms.length === 0) {
        return { count: 0, message: `No available rooms found for ${date} between ${startTime} and ${endTime}.` };
      }

      return availableRooms.map((r) => ({
        id: r.id,
        room_number: r.room_number,
        type: r.type,
        capacity: r.capacity,
        equipment: r.equipment,
        floor: r.floor,
      }));
    }

    case "book_room": {
      const roomNum = String(args.room_number || "").trim();
      const date = String(args.date || "").trim();
      const startTime = normalizeTime(String(args.start_time || ""));
      const endTime = normalizeTime(String(args.end_time || ""));
      const purpose = String(args.purpose || "Study / Meeting").trim();

      const { data: rooms } = await admin.from("rooms").select("*");
      const roomList = (rooms || []) as Room[];
      const room = findRoom(roomList, roomNum);

      if (!room) return { ok: false, error: `Room '${roomNum}' not found.` };

      const res = await bookRoom(room.id, { date, start_time: startTime, end_time: endTime, purpose }, callerProfile);
      if (!res.ok) return { ok: false, error: res.error };
      return { ok: true, room_number: room.room_number, date, start_time: startTime, end_time: endTime, purpose };
    }

    case "cancel_room_booking": {
      const roomNum = String(args.room_number || "").trim();
      const bookingId = String(args.booking_id || "").trim();

      const { data: rooms } = await admin.from("rooms").select("*");
      const roomList = (rooms || []) as Room[];
      const room = findRoom(roomList, roomNum);

      if (!room) return { ok: false, error: `Room '${roomNum}' not found.` };

      const res = await cancelRoomBooking(room.id, bookingId, callerProfile);
      if (!res.ok) return { ok: false, error: res.error };
      return { ok: true, message: `Cancelled booking ${bookingId} for room ${room.room_number}` };
    }

    case "register_for_event": {
      const target = String(args.event_name_or_id || "").trim();
      const { data: events } = await admin.from("events").select("*");
      const eventList = (events || []) as Event[];
      const event = findEvent(eventList, target);

      if (!event) return { ok: false, error: `Event '${target}' not found.` };

      const res = await registerForEvent(event.id, callerProfile);
      if (!res.ok) return { ok: false, error: res.error };
      return { ok: true, event_id: event.id, event_name: event.name, date: event.date };
    }

    case "cancel_event_registration": {
      const target = String(args.event_id_or_name || "").trim();
      const { data: events } = await admin.from("events").select("*");
      const eventList = (events || []) as Event[];
      const event = findEvent(eventList, target);

      if (!event) return { ok: false, error: `Event '${target}' not found.` };

      const res = await cancelEventRegistration(event.id, callerProfile);
      if (!res.ok) return { ok: false, error: res.error };
      return { ok: true, event_id: event.id, event_name: event.name };
    }

    default:
      return { error: `Unknown tool name: ${name}` };
  }
}
