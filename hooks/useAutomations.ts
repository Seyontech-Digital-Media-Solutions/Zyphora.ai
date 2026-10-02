"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Automation } from "@/types";

export function useAutomations() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAutomations = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAutomations([]);
      setError("Please log in to see your automations.");
      setLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("automations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
    } else {
      setAutomations((data ?? []) as Automation[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const toggleActive = async (id: string, isActive: boolean) => {
    const previous = automations;
    // Optimistic update — flip it back if the write fails.
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_active: isActive } : a))
    );

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("automations")
      .update({ is_active: isActive })
      .eq("id", id);

    if (updateError) {
      setAutomations(previous);
      setError(updateError.message);
    }
  };

  const deleteAutomation = async (id: string) => {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("automations")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return false;
    }
    setAutomations((prev) => prev.filter((a) => a.id !== id));
    return true;
  };

  const duplicateAutomation = async (id: string) => {
    const original = automations.find((a) => a.id === id);
    if (!original) return null;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error: insertError } = await supabase
      .from("automations")
      .insert({
        user_id: user.id,
        name: `${original.name} (copy)`,
        description: original.description,
        trigger_type: original.trigger_type,
        trigger_config: original.trigger_config,
        steps: original.steps,
        is_active: false,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return null;
    }
    setAutomations((prev) => [data as Automation, ...prev]);
    return data;
  };

  return {
    automations,
    loading,
    error,
    refetch: fetchAutomations,
    toggleActive,
    deleteAutomation,
    duplicateAutomation,
  };
}