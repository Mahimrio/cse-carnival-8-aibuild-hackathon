import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return <div aria-busy="true" aria-label="Loading campus data"><div className="mb-6 space-y-2"><Skeleton className="h-8 w-40" /><Skeleton className="h-4 w-72 max-w-full" /></div><div className="mb-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-32" />)}</div><Skeleton className="mb-6 h-12 w-full" /><div className="space-y-3">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24 w-full" />)}</div></div>;
}