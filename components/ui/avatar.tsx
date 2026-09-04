import { cn } from "@/lib/utils";

const colors = ["bg-teal-600", "bg-indigo-600", "bg-amber-500", "bg-blue-600", "bg-rose-600"];

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const initials = name.split(/\s+/).map((word) => word[0]).join("").toUpperCase().slice(0, 2);
  const hash = [...name].reduce((value, character) => value + character.charCodeAt(0), 0);
  const sizes = { sm: "size-7 text-xs", md: "size-9 text-sm", lg: "size-12 text-base" };
  return <span className={cn("grid shrink-0 place-items-center rounded-full font-semibold text-white", colors[hash % colors.length], sizes[size], className)} aria-label={name}>{initials}</span>;
}