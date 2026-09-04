import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.status !== "active") redirect("/pending");
  return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950"><AppHeader profile={profile} /><main className="mx-auto w-full max-w-screen-xl px-4 py-6 sm:py-8">{children}</main></div>;
}