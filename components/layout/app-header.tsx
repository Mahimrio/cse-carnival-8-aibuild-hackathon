"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Building2, Camera, History, LayoutDashboard, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { signOutAction } from "@/lib/actions/auth";
import { isManager, roleColor, roleName } from "@/lib/auth/roles";
import type { Profile } from "@/lib/types";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AppHeader({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, visible: true },
    { href: "/smart-entry", label: "Smart Entry", icon: Camera, visible: isManager(profile.role) },
    { href: "/history", label: "History", icon: History, visible: true },
    { href: "/admin", label: "Admin", icon: ShieldCheck, visible: profile.role === "super_admin" },
    { href: "/agent", label: "Ask CampusOS", icon: Bot, visible: true },
  ].filter((item) => item.visible);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-4 px-4">
        <Link href="/" className="mr-2 flex shrink-0 items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Building2 aria-hidden="true" size={16} /></span><span className="font-heading text-lg font-semibold">CampusOS</span></Link>
        <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Main navigation">
          {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground", pathname === href && "bg-teal-50 text-primary dark:bg-teal-900/20")}><Icon aria-hidden="true" size={16} />{label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && <Badge className="hidden bg-amber-100 text-amber-800 sm:inline-flex dark:bg-amber-900/40 dark:text-amber-300">Demo mode</Badge>}
          <ThemeToggle />
          <div className="flex items-center gap-2 border-l pl-2">
            <div className="hidden flex-col items-end sm:flex"><span className="text-xs font-medium">{profile.full_name}</span><Badge className={`mt-1 ${roleColor(profile.role)}`}>{roleName(profile.role)}</Badge></div>
            <Avatar name={profile.full_name} size="sm" />
            <form action={signOutAction}><button type="submit" className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30" aria-label="Sign out" title="Sign out"><LogOut aria-hidden="true" size={16} /></button></form>
          </div>
          <button type="button" className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted md:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle navigation" aria-expanded={mobileOpen}>{mobileOpen ? <X aria-hidden="true" size={18} /> : <Menu aria-hidden="true" size={18} />}</button>
        </div>
      </div>
      {mobileOpen && <nav className="flex flex-col gap-1 border-t bg-background px-4 py-3 md:hidden" aria-label="Mobile navigation">{navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={cn("flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted", pathname === href && "bg-teal-50 text-primary dark:bg-teal-900/20")}><Icon aria-hidden="true" size={16} />{label}</Link>)}</nav>}
    </header>
  );
}