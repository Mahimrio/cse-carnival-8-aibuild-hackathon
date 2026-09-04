"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const TABLES = ["schedules", "rooms", "events", "announcements", "assignments"];

export function LiveDashboardRefresh() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => router.refresh(), 150);
    };
    const channel = supabase.channel("campus-dashboard");
    TABLES.forEach((table) => channel.on("postgres_changes", { event: "*", schema: "public", table }, refresh));
    channel.subscribe();
    const fallback = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 10_000);

    return () => {
      clearTimeout(refreshTimer);
      clearInterval(fallback);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}