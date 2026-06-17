"use client";

import { useCallback, useEffect, useState } from "react";
import { MOCK_AUTOMATIONS } from "@/lib/mock/data";
import type { Automation } from "@/types";

function toAutomation(mock: (typeof MOCK_AUTOMATIONS)[number]): Automation {
  return {
    id: mock.id,
    user_id: "mock",
    name: mock.name,
    description: null,
    trigger_type: mock.trigger_type,
    trigger_config: {},
    steps: [],
    is_active: mock.is_active,
    run_count: mock.run_count,
    last_run_at: mock.last_run_at,
    n8n_workflow_id: null,
    created_at: mock.last_run_at,
  };
}

export function useAutomations() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAutomations = useCallback(async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    setAutomations(MOCK_AUTOMATIONS.map(toAutomation));
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const toggleActive = async (id: string, isActive: boolean) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_active: isActive } : a))
    );
  };

  return { automations, loading, error, refetch: fetchAutomations, toggleActive };
}
