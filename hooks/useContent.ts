"use client";

import { useCallback, useEffect, useState } from "react";
import { MOCK_CONTENT_ITEMS } from "@/lib/mock/data";
import type { ContentItem, ContentStatus } from "@/types";

function toContentItem(
  mock: (typeof MOCK_CONTENT_ITEMS)[number]
): ContentItem {
  return {
    id: mock.id,
    user_id: "mock",
    title: mock.title,
    body: mock.body,
    platform: mock.platform,
    media_urls: null,
    status: mock.status as ContentStatus,
    scheduled_at: mock.scheduled_at ?? null,
    published_at: mock.published_at ?? null,
    post_id_external: null,
    analytics: mock.analytics ?? {},
    ai_generated: true,
    tone: null,
    hashtags: mock.hashtags ?? null,
    created_at: mock.published_at ?? mock.scheduled_at ?? new Date().toISOString(),
  };
}

export function useContent(status?: ContentStatus) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    let data = MOCK_CONTENT_ITEMS.map(toContentItem);
    if (status) data = data.filter((item) => item.status === status);
    setItems(data);
    setError(null);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const updateStatus = async (id: string, newStatus: ContentStatus) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const deleteItem = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return { items, loading, error, refetch: fetchContent, updateStatus, deleteItem };
}
