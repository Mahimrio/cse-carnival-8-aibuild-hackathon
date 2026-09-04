import Link from "next/link";
import { Building2, Home } from "lucide-react";

export default function AppNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-teal-50 text-primary dark:bg-teal-950/40">
        <Building2 size={28} aria-hidden="true" />
      </div>
      <h2 className="font-heading text-2xl font-bold tracking-tight">Section Not Found</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This section or entity is not available. Please return to the main dashboard.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-card bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:brightness-90"
      >
        <Home size={16} aria-hidden="true" />
        Back to Dashboard
      </Link>
    </div>
  );
}
