"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  tokens_used?: number | null;
  created_at?: string;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load the sidebar list ────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    setLoadingList(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setConversations([]);
      setError("Please log in to see your conversations.");
      setLoadingList(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("conversations")
      .select("id, title, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
    } else {
      setConversations((data ?? []) as Conversation[]);
      setError(null);
    }
    setLoadingList(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ── Load one conversation's messages ─────────────────────────────────────
  const openConversation = useCallback(async (conversationId: string) => {
    setActiveId(conversationId);
    setLoadingMessages(true);
    const supabase = createClient();

    const { data, error: queryError } = await supabase
      .from("messages")
      .select("id, role, content, tokens_used, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (queryError) {
      setError(queryError.message);
      setMessages([]);
    } else {
      setMessages((data ?? []) as ChatMessage[]);
      setError(null);
    }
    setLoadingMessages(false);
  }, []);

  // ── Start a fresh chat (no DB row until the first message) ───────────────
  const startNewChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
  }, []);

  // ── Create a conversation row, titled from the first user message ────────
  const createConversation = useCallback(
    async (firstMessage: string): Promise<string | null> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Please log in first.");
        return null;
      }

      const title =
        firstMessage.length > 50
          ? `${firstMessage.slice(0, 50).trim()}…`
          : firstMessage.trim();

      const { data, error: insertError } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title })
        .select("id, title, created_at, updated_at")
        .single();

      if (insertError || !data) {
        setError(insertError?.message ?? "Could not start conversation.");
        return null;
      }

      setConversations((prev) => [data as Conversation, ...prev]);
      setActiveId(data.id);
      return data.id;
    },
    []
  );

  // ── Persist a single message ─────────────────────────────────────────────
  const saveMessage = useCallback(
    async (
      conversationId: string,
      role: "user" | "assistant",
      content: string,
      tokensUsed?: number
    ) => {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        role,
        content,
        tokens_used: tokensUsed ?? null,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      // Bump the conversation so it sorts to the top of the sidebar.
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      setConversations((prev) =>
        [...prev]
          .map((c) =>
            c.id === conversationId
              ? { ...c, updated_at: new Date().toISOString() }
              : c
          )
          .sort((a, b) =>
            (b.updated_at ?? b.created_at).localeCompare(
              a.updated_at ?? a.created_at
            )
          )
      );
    },
    []
  );

  // ── Optimistic local append (so the UI updates before the DB round trip) ──
  const appendLocal = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeId === conversationId) {
        setActiveId(null);
        setMessages([]);
      }
    },
    [activeId]
  );

  const renameConversation = useCallback(
    async (conversationId: string, newTitle: string) => {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("conversations")
        .update({ title: newTitle })
        .eq("id", conversationId);

      if (updateError) {
        setError(updateError.message);
        return;
      }
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, title: newTitle } : c))
      );
    },
    []
  );

  return {
    conversations,
    activeId,
    messages,
    loadingList,
    loadingMessages,
    error,
    openConversation,
    startNewChat,
    createConversation,
    saveMessage,
    appendLocal,
    deleteConversation,
    renameConversation,
    refetch: fetchConversations,
  };
}