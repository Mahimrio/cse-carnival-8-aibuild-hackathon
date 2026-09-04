import Link from "next/link";
import { Building2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthShell({ title, description, children, footer }: { title: string; description: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="absolute right-5 top-5"><ThemeToggle /></div>
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="mb-3 grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(15,118,110,0.3)]" aria-label="CampusOS home">
            <Building2 aria-hidden="true" size={22} />
          </Link>
          <h1 className="font-heading text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-card border bg-card p-6 shadow-(--shadow-card)">{children}</div>
        {footer}
      </div>
    </main>
  );
}