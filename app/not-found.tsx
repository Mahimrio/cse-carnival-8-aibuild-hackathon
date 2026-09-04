import Link from "next/link";
import { Building2, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mx-auto max-w-md space-y-6">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-teal-50 text-primary shadow-sm dark:bg-teal-950/40">
          <Building2 size={32} aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            404 • Page Not Found
          </span>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Location Not On Campus
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            The page or campus resource you were looking for doesn&apos;t exist or has moved.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-card bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:brightness-90"
          >
            <Home size={16} aria-hidden="true" />
            Campus Dashboard
          </Link>
          <Link
            href="/agent"
            className="inline-flex items-center justify-center gap-2 rounded-card border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Ask CampusOS AI
          </Link>
        </div>
      </div>
    </div>
  );
}
