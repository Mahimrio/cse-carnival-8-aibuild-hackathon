import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export function DestinationShell({ title, description, emptyTitle, emptyDescription, icon: Icon, showSkeleton = false }: { title: string; description: string; emptyTitle: string; emptyDescription: string; icon: LucideIcon; showSkeleton?: boolean }) {
  return <div><div className="mb-6"><h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><Icon aria-hidden="true" className="text-primary" size={22} />{title}</h1><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>{showSkeleton ? <Card><CardContent className="space-y-4 pt-5"><Skeleton className="h-12 w-3/4" /><Skeleton className="h-20 w-full" /><Skeleton className="h-12 w-5/6" /></CardContent></Card> : <EmptyState title={emptyTitle} description={emptyDescription} icon={<Icon aria-hidden="true" size={22} />} />}</div>;
}