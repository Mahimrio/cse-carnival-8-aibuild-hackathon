import type { Profile, UserRole } from "@/lib/types";

export function isManager(role: UserRole) {
  return role === "super_admin" || role === "cr" || role === "sr";
}

export function isAdmin(role: UserRole) {
  return role === "super_admin";
}

export function roleName(role: UserRole) {
  return {
    super_admin: "Super Admin",
    cr: "Class Representative",
    sr: "Society Representative",
    student: "Student",
  }[role];
}

export function roleColor(role: UserRole) {
  if (role === "super_admin") return "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300";
  if (role === "cr" || role === "sr") return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300";
  return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
}

export function proposerLabel(profile: Profile) {
  const role = profile.role === "super_admin" ? "Admin" : profile.role.toUpperCase();
  const academic = [
    profile.section && `Sec-${profile.section}`,
    profile.semester && `Sem-${profile.semester}`,
    profile.year && `Yr-${profile.year}`,
  ].filter(Boolean);
  return academic.length ? `${role} ${academic.join(" ")}` : profile.full_name || roleName(profile.role);
}