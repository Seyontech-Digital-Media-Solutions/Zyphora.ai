"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ContentItem, ContentStatus } from "@/types";

export function useContent(status?: ContentStatus) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setItems([]);
      setError("Please log in to see your content.");
      setLoading(false);
      return;
    }

    let query = supabase
      .from("content_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error: queryError } = await query;

    if (queryError) {
      setError(queryError.message);
      setItems([]);
    } else {
      setItems((data ?? []) as ContentItem[]);
      setError(null);
    }
    setLoading(false);
  }, [status]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const updateStatus = async (id: string, newStatus: ContentStatus) => {
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("content_items")
      .update({ status: newStatus })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const deleteItem = async (id: string) => {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("content_items")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return { items, loading, error, refetch: fetchContent, updateStatus, deleteItem };
}