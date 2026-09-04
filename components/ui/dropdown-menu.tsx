import { cn } from "@/lib/utils";

export function DropdownMenu({ trigger, children, className }: { trigger: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <details className={cn("group relative", className)}><summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">{trigger}</summary><div className="absolute right-0 z-40 mt-2 min-w-44 rounded-card border bg-card p-1 shadow-lg">{children}</div></details>;
}
export function DropdownMenuItem({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted", className)} {...props} />;
}