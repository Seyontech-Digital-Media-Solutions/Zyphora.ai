"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AnalyticsSnapshot } from "@/types";

export function useAnalytics() {
  const [snapshots, setSnapshots] = useState<AnalyticsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("analytics_snapshots")
      .select("*")
      .order("created_at", { ascending: false });
    setSnapshots((data as AnalyticsSnapshot[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { snapshots, loading, refetch: fetchAnalytics };
}
