import { Bot, Building2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted px-6 py-12">
      <section className="w-full max-w-xl rounded-card border bg-card p-8 shadow-(--shadow-card) sm:p-10">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-card bg-primary text-primary-foreground">
            <Building2 aria-hidden="true" size={24} />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-bold">CampusOS</h1>
            <p className="text-sm text-muted-foreground">AUST campus, one source of truth.</p>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex items-start gap-4 rounded-card border bg-background p-5">
          <Bot className="mt-0.5 shrink-0 text-primary" aria-hidden="true" size={22} />
          <div>
            <h2 className="font-heading font-semibold">Foundation ready</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              The live dashboard, role-based workflows, and CampusOS agent are being connected.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
