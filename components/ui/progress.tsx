import { cn } from "@/lib/utils";

export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  const percentage = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-[width]", percentage >= 85 && "bg-danger")}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}