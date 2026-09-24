"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Download, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConversations } from "@/hooks/useConversations";
import { toast } from "@/lib/toast";

const QUICK_PROMPTS = [
  "Write a cold email",
  "Plan my content",
  "Analyze my performance",
  "Generate post ideas",
];

export default function InboxPage() {
  const {
    conversations,
    activeId,
    messages,
    loadingList,
    loadingMessages,
    openConversation,
    startNewChat,
    createConversation,
    saveMessage,
    appendLocal,
    deleteConversation,
  } = useConversations();

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;

    setInput("");
    setSending(true);

    try {
      // First message in a brand-new chat creates the conversation row.
      let conversationId = activeId;
      if (!conversationId) {
        conversationId = await createConversation(content);
        if (!conversationId) {
          toast("Couldn't start the conversation.", "error");
          return;
        }
      }

      appendLocal({ role: "user", content });
      await saveMessage(conversationId, "user", content);

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();

      const reply = data.content ?? "Sorry, something went wrong.";
      const tokens = data.tokens_used ?? Math.ceil(reply.length / 4);

      appendLocal({ role: "assistant", content: reply, tokens_used: tokens });
      await saveMessage(conversationId, "assistant", reply, tokens);
    } catch {
      appendLocal({
        role: "assistant",
        content: "Sorry, something went wrong.",
      });
    } finally {
      setSending(false);
    }
  };

  const exportChat = () => {
    const text = messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zyphora-chat.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteConversation(id);
    toast("Conversation deleted", "success");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-surface">
        <div className="p-4 border-b border-border">
          <Button className="w-full bg-accent" onClick={startNewChat}>
            <Sparkles className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1 p-2">
          {loadingList ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No conversations yet.
            </p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => openConversation(c.id)}
                className={cn(
                  "group w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-muted",
                  activeId === c.id && "bg-muted"
                )}
              >
                <span className="flex-1 truncate">{c.title ?? "Untitled"}</span>
                <button
                  onClick={(e) => handleDelete(e, c.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </ScrollArea>
      </aside>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h1 className="font-semibold">AI Assistant</h1>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={exportChat}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 p-4">
          {loadingMessages ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              Loading conversation…
            </p>
          ) : messages.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center py-12">
              <Sparkles className="h-12 w-12 text-accent mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">How can I help?</h2>
              <p className="text-muted-foreground mb-8">
                Ask me about content, strategy, emails, and more.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {QUICK_PROMPTS.map((p) => (
                  <Card
                    key={p}
                    className="p-3 text-sm text-left cursor-pointer hover:border-accent/50 bg-surface border-border"
                    onClick={() => send(p)}
                  >
                    {p}
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={msg.id ?? i}
                  className={cn(
                    "rounded-xl px-4 py-3 max-w-[85%] text-sm",
                    msg.role === "user"
                      ? "ml-auto bg-accent text-white"
                      : "bg-muted"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.tokens_used ? (
                    <p className="text-xs opacity-60 mt-2">
                      {msg.tokens_used} tokens
                    </p>
                  ) : null}
                </div>
              ))}
              {sending && (
                <div className="rounded-xl px-4 py-3 max-w-[85%] text-sm bg-muted">
                  <p className="text-muted-foreground">Thinking…</p>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Message Zyphora AI..."
              disabled={sending}
            />
            <Button onClick={() => send()} disabled={sending} className="bg-accent">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}