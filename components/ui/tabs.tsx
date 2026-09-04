"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface TabItem { id: string; label: string; icon?: React.ReactNode; badge?: number; }

export function Tabs({ tabs, activeTab, onChange, className }: { tabs: TabItem[]; activeTab: string; onChange: (id: string) => void; className?: string }) {
  return (
    <div className={cn("flex gap-1 overflow-x-auto rounded-card bg-muted p-1", className)} role="tablist">
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button key={tab.id} type="button" role="tab" aria-selected={active} onClick={() => onChange(tab.id)} className={cn("flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground", active && "bg-card text-primary shadow-sm")}>
            {tab.icon}{tab.label}
            {!!tab.badge && <span className={cn("grid size-5 place-items-center rounded-full bg-zinc-200 text-xs dark:bg-zinc-700", active && "bg-primary text-primary-foreground")}>{tab.badge > 99 ? "99+" : tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function useTabs(defaultTab: string) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return { activeTab, setActiveTab };
}