import { cn } from "@/lib/utils";

export function Alert({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "danger" }) {
  return <div role="alert" className={cn("rounded-card border bg-card p-4 text-sm", variant === "danger" && "border-danger/30 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200", className)} {...props} />;
}
export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) { return <h5 className={cn("mb-1 font-heading font-semibold", className)} {...props} />; }
export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) { return <p className={cn("leading-6 text-muted-foreground", className)} {...props} />; }