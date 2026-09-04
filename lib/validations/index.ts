import { z } from "zod";

const id = z.string().trim().min(1);
const text = z.string().trim().min(1);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:MM");

export const scheduleSchema = z.object({
  id,
  course: text,
  title: text,
  day: z.enum(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]),
  start_time: time,
  end_time: time,
  room: text,
  instructor: text,
  section: text,
});

export const bookingSchema = z.object({
  booking_id: id,
  booked_by: text,
  date: isoDate,
  start_time: time,
  end_time: time,
  purpose: text,
});

export const roomSchema = z.object({
  id,
  room_number: text,
  type: z.enum(["classroom", "lab", "seminar"]),
  capacity: z.number().int().positive(),
  equipment: z.array(text),
  floor: z.number().int().nonnegative(),
  status: z.enum(["available", "unavailable"]),
  bookings: z.array(bookingSchema),
});

export const registrationSchema = z.object({ student_id: id, name: text });

export const eventSchema = z.object({
  id,
  name: text,
  description: text,
  date: isoDate,
  start_time: time,
  end_time: time,
  end_date: isoDate,
  venue: text,
  organizer: text,
  capacity: z.number().int().positive(),
  registered: z.number().int().nonnegative(),
  registrations: z.array(registrationSchema),
  status: z.enum(["upcoming", "ongoing", "completed", "cancelled", "full"]),
});

export const announcementSchema = z.object({
  id,
  title: text,
  body: text,
  date: isoDate,
  priority: z.enum(["high", "medium", "low"]),
  posted_by: text,
  expires: isoDate,
});

export const assignmentSchema = z.object({
  id,
  course: text,
  course_title: text,
  title: text,
  description: text,
  assigned_date: isoDate,
  deadline: isoDate,
  submission_platform: text,
  status: z.enum(["pending", "submitted", "graded", "late"]),
  marks: z.number().int().nonnegative(),
});

export const profileSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  full_name: z.string(),
  role: z.enum(["super_admin", "cr", "sr", "student"]),
  requested_role: z.enum(["cr", "sr", "student"]),
  status: z.enum(["pending", "active", "rejected"]),
  section: z.string().nullable(),
  semester: z.string().nullable(),
  year: z.string().nullable(),
  created_at: z.iso.datetime(),
});

export const pendingChangeSchema = z.object({
  id: z.uuid(),
  entity_type: z.enum(["schedule", "room", "event", "announcement", "assignment"]),
  operation: z.enum(["add", "edit", "delete"]),
  target_id: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
  source: z.enum(["ai_image", "manual"]),
  image_url: z.url().nullable(),
  status: z.enum(["pending", "accepted", "rejected"]),
  proposed_by: z.uuid().nullable(),
  proposer_label: text,
  created_at: z.iso.datetime(),
  reviewed_by: z.uuid().nullable(),
  reviewed_at: z.iso.datetime().nullable(),
});

export const auditLogSchema = z.object({
  id: z.uuid(),
  actor_id: z.uuid().nullable(),
  actor_label: text,
  actor_role: z.enum(["super_admin", "cr", "sr", "student"]),
  action: text,
  entity_type: z.enum(["schedule", "room", "event", "announcement", "assignment"]),
  entity_id: z.string().nullable(),
  summary: text,
  details: z.record(z.string(), z.unknown()),
  created_at: z.iso.datetime(),
});

export const seedSchemas = {
  schedules: z.array(scheduleSchema),
  rooms: z.array(roomSchema),
  events: z.array(eventSchema),
  announcements: z.array(announcementSchema),
  assignments: z.array(assignmentSchema),
};