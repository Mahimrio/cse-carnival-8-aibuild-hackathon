"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Shield, XCircle } from "lucide-react";
import { toast } from "sonner";
import { approveUser, rejectUser, updateUserRole } from "@/lib/actions/admin";
import { roleColor, roleName } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { Select } from "@/components/ui/select";

export function AdminPanel({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [roleOverrides, setRoleOverrides] = useState<Record<string, UserRole>>({});
  const waiting = profiles.filter((profile) => profile.status === "pending");
  const active = profiles.filter((profile) => profile.status === "active");
  const rejected = profiles.filter((profile) => profile.status === "rejected");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("admin-profiles").on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => router.refresh()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [router]);

  function run(action: () => Promise<void>, message: string) {
    startTransition(async () => {
      try { await action(); toast.success(message); router.refresh(); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Account update failed."); }
    });
  }

  return (
    <div>
      <div className="mb-6"><h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><Shield className="text-primary" aria-hidden="true" size={22} />Admin Panel</h1><p className="mt-1 text-sm text-muted-foreground">{waiting.length} pending · {active.length} active · {rejected.length} rejected</p></div>
      <section className="mb-8"><SectionHeader title="Pending Approvals" description={`${waiting.length} accounts awaiting review`} className="mb-4" />
        {waiting.length === 0 ? <EmptyState title="No pending requests" description="All accounts have been reviewed." icon={<CheckCircle size={22} />} /> : <div className="flex flex-col gap-3">{waiting.map((profile) => { const selectedRole = roleOverrides[profile.id] ?? profile.requested_role; return <Card key={profile.id}><CardContent className="flex flex-col gap-4 pb-4 pt-4 lg:flex-row lg:items-center"><Avatar name={profile.full_name} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">{profile.full_name}</p><Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Pending</Badge></div><p className="text-xs text-muted-foreground">{profile.email}</p><p className="mt-1 text-xs text-muted-foreground">Requested: <strong>{roleName(profile.requested_role)}</strong>{profile.section && ` · Section ${profile.section}`}{profile.semester && ` · Semester ${profile.semester}`}{profile.year && ` · Year ${profile.year}`}</p></div><div className="grid gap-2 sm:grid-cols-[9rem_auto_auto]"><Select aria-label={`Role for ${profile.full_name}`} value={selectedRole} onChange={(event) => setRoleOverrides((roles) => ({ ...roles, [profile.id]: event.target.value as UserRole }))}><option value="student">Student</option><option value="cr">Course Rep</option><option value="sr">Senior Rep</option><option value="super_admin">Super Admin</option></Select><Button size="sm" disabled={pending} onClick={() => run(() => approveUser(profile.id, selectedRole), `${profile.full_name} approved.`)}><CheckCircle size={14} />Approve</Button><Button size="sm" variant="danger" disabled={pending} onClick={() => run(() => rejectUser(profile.id), `${profile.full_name} rejected.`)}><XCircle size={14} />Reject</Button></div></CardContent></Card>; })}</div>}
      </section>
      <section className="mb-8"><SectionHeader title="Active Users" description={`${active.length} users with access`} className="mb-4" /><div className="flex flex-col gap-2">{active.map((profile) => <div key={profile.id} className="flex flex-wrap items-center gap-3 rounded-card border bg-card px-4 py-3"><Avatar name={profile.full_name} size="sm" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{profile.full_name} {profile.id === currentUserId && <Badge className="ml-1 bg-teal-100 text-teal-700">You</Badge>}</p><p className="text-xs text-muted-foreground">{profile.email}</p></div><Select className="w-40" value={profile.role} disabled={pending || profile.id === currentUserId} aria-label={`Change role for ${profile.full_name}`} onChange={(event) => run(() => updateUserRole(profile.id, event.target.value as UserRole), `${profile.full_name}'s role updated.`)}><option value="student">Student</option><option value="cr">Course Rep</option><option value="sr">Senior Rep</option><option value="super_admin">Super Admin</option></Select><Badge className={roleColor(profile.role)}>{roleName(profile.role)}</Badge></div>)}</div></section>
      {rejected.length > 0 && <section><SectionHeader title="Rejected Accounts" description={`${rejected.length} rejected requests`} className="mb-4" /><div className="flex flex-col gap-2">{rejected.map((profile) => <div key={profile.id} className="flex items-center gap-3 rounded-card border bg-card px-4 py-3 opacity-70"><Avatar name={profile.full_name} size="sm" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{profile.full_name}</p><p className="text-xs text-muted-foreground">{profile.email}</p></div><Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Rejected</Badge></div>)}</div></section>}
    </div>
  );
}