"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AIChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content ?? "Sorry, I couldn't process that." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#6C63FF] text-white shadow-[0_0_30px_rgba(108,99,255,0.35)] transition-transform duration-200 hover:-translate-y-1 hover:bg-[#7B6BFF]"
        aria-label="Open quick actions"
      >
        <Sparkles className="h-6 w-6" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-md bg-[#090B1E]/95 border border-white/10 shadow-glow backdrop-blur-xl">
          <SheetHeader>
            <SheetTitle className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
              <Sparkles className="h-5 w-5 text-[#A78BFA]" />
              Quick Actions
            </SheetTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button render={<a href="/content/create" />} variant="secondary" className="rounded-3xl bg-white/5 px-3 py-3 text-sm text-foreground hover:bg-white/10">
                Create content
              </Button>
              <Button render={<a href="/content?tab=scheduled" />} variant="secondary" className="rounded-3xl bg-white/5 px-3 py-3 text-sm text-foreground hover:bg-white/10">
                Schedule post
              </Button>
              <Button render={<a href="/analytics" />} variant="secondary" className="rounded-3xl bg-white/5 px-3 py-3 text-sm text-foreground hover:bg-white/10">
                View analytics
              </Button>
            </div>
          </SheetHeader>

          <div className="px-4 pb-4">
            <p className="text-sm text-muted-foreground">Ask Zyphora AI for strategy, content ideas, or workflow recommendations.</p>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 py-2">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Type a question to get instant AI guidance.
                </p>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-3xl px-4 py-3 text-sm max-w-[85%]",
                    msg.role === "user"
                      ? "ml-auto bg-[#6C63FF]/90 text-white"
                      : "bg-white/5 text-foreground"
                  )}
                >
                  {msg.content}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex gap-2 border-t border-white/10 px-4 py-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask Zyphora AI..."
              disabled={loading}
              className="bg-[#0A0C1D]/90 text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
            />
            <Button onClick={sendMessage} disabled={loading} size="icon" className="bg-[#6C63FF] text-white hover:bg-[#7B6BFF]">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
