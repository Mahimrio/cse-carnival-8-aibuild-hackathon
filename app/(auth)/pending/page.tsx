import { Clock, LogOut } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { roleName } from "@/lib/auth/roles";
import { signOutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export default async function PendingPage() {
  const profile = await getCurrentProfile();
  const rejected = profile?.status === "rejected";
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md text-center">
        <div className={`mx-auto mb-6 grid size-20 place-items-center rounded-full ${rejected ? "bg-red-100 text-red-600 dark:bg-red-900/30" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30"}`}><Clock aria-hidden="true" size={36} /></div>
        <h1 className="mb-2 font-heading text-2xl font-bold">{rejected ? "Account Request Rejected" : "Account Pending Approval"}</h1>
        <p className="mb-2 text-muted-foreground">Hey {profile?.full_name || "there"}! {rejected ? "Your account request was not approved." : "Your account is waiting for approval from a CampusOS administrator."}</p>
        {!rejected && <p className="mb-8 text-sm text-muted-foreground">You requested the role of <span className="font-medium text-foreground">{roleName(profile?.requested_role ?? "student")}</span>.</p>}
        <form action={signOutAction}><Button variant="outline" className="w-full"><LogOut aria-hidden="true" size={16} />Sign Out</Button></form>
      </div>
    </main>
  );
}