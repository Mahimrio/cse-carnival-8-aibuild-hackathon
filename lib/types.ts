export type UserRole = "super_admin" | "cr" | "sr" | "student";
export type ProfileStatus = "pending" | "active" | "rejected";
export type EntityType = "schedule" | "room" | "event" | "announcement" | "assignment";

export interface Schedule {
  id: string;
  course: string;
  title: string;
  day: "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday";
  start_time: string;
  end_time: string;
  room: string;
  instructor: string;
  section: string;
}

export interface Booking {
  booking_id: string;
  booked_by: string;
  date: string;
  start_time: string;
  end_time: string;
  purpose: string;
}

export interface Room {
  id: string;
  room_number: string;
  type: "classroom" | "lab" | "seminar";
  capacity: number;
  equipment: string[];
  floor: number;
  status: "available" | "unavailable";
  bookings: Booking[];
}

export interface Registration {
  student_id: string;
  name: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  end_date: string;
  venue: string;
  organizer: string;
  capacity: number;
  registered: number;
  registrations: Registration[];
  status: "upcoming" | "ongoing" | "completed" | "cancelled" | "full";
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  priority: "high" | "medium" | "low";
  posted_by: string;
  expires: string;
}

export interface Assignment {
  id: string;
  course: string;
  course_title: string;
  title: string;
  description: string;
  assigned_date: string;
  deadline: string;
  submission_platform: string;
  status: "pending" | "submitted" | "graded" | "late";
  marks: number;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  requested_role: Exclude<UserRole, "super_admin">;
  status: ProfileStatus;
  section: string | null;
  semester: string | null;
  year: string | null;
  created_at: string;
}

export interface PendingChange {
  id: string;
  entity_type: EntityType;
  operation: "add" | "edit" | "delete";
  target_id: string | null;
  payload: Record<string, unknown>;
  source: "ai_image" | "manual";
  image_url: string | null;
  status: "pending" | "accepted" | "rejected";
  proposed_by: string | null;
  proposer_label: string;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_label: string;
  actor_role: UserRole;
  action: string;
  entity_type: EntityType;
  entity_id: string | null;
  summary: string;
  details: Record<string, unknown>;
  created_at: string;
}