"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_CONVERSATIONS } from "@/lib/mock/data";

const QUICK_PROMPTS = [
  "Write a cold email",
  "Plan my content",
  "Analyze my performance",
  "Generate post ideas",
];

interface Message {
  role: "user" | "assistant";
  content: string;
  tokens?: number;
}

export default function InboxPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations] = useState(MOCK_CONVERSATIONS);

  const send = async (text?: string) => {
    const content = text ?? input;
    if (!content.trim() || loading) return;
    setInput("");
    const newMessages = [...messages, { role: "user" as const, content }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content ?? "Sorry, something went wrong.",
          tokens: Math.ceil((data.content?.length ?? 0) / 4),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
    } finally {
      setLoading(false);
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
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-surface">
        <div className="p-4 border-b border-border">
          <Button className="w-full bg-accent" onClick={() => setMessages([])}>
            <Sparkles className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1 p-2">
          {conversations.map((c) => (
            <button
              key={c.id}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted truncate"
            >
              {c.title}
            </button>
          ))}
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
          {messages.length === 0 ? (
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
                  key={i}
                  className={cn(
                    "rounded-xl px-4 py-3 max-w-[85%] text-sm",
                    msg.role === "user"
                      ? "ml-auto bg-accent text-white"
                      : "bg-muted"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.tokens && (
                    <p className="text-xs opacity-60 mt-2">{msg.tokens} tokens</p>
                  )}
                </div>
              ))}
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
              disabled={loading}
            />
            <Button onClick={() => send()} disabled={loading} className="bg-accent">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
