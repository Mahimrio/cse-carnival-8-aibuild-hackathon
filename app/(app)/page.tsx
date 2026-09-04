import { redirect } from "next/navigation";
import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getDashboardData } from "@/lib/data/dashboard";
import { getNow, getToday } from "@/lib/now";

export default async function HomePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const data = await getDashboardData();
  const today = getToday();
  const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(new Date(`${today}T12:00:00Z`));
  const currentTime = getNow().toTimeString().slice(0, 5);
  return <DashboardFrame profile={profile} today={today} dayName={dayName} currentTime={currentTime} data={data} />;
}