import { redirect } from "next/navigation";
import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getToday } from "@/lib/now";

export default async function HomePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const today = getToday();
  const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(new Date(`${today}T12:00:00Z`));
  return <DashboardFrame profile={profile} today={today} dayName={dayName} />;
}