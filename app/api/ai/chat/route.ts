import { NextRequest, NextResponse } from "next/server";
import { mockChatResponse } from "@/lib/mock/ai";

const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_TEXT_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are Zyphora AI, an assistant inside a social media management platform.
You help with content strategy, writing posts and captions, cold emails, analytics
interpretation, and campaign planning. Be concise and practical. When asked for
copy, give usable drafts rather than descriptions of what you'd write.`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    const apiKey = process.env.GROQ_API_KEY?.trim();

    // No key configured — fall back to the mock so the UI still works.
    if (!apiKey) {
      const response = await mockChatResponse(message);
      return NextResponse.json({ content: response, _demo: true });
    }

    // Include prior turns so the assistant has conversation context.
    const priorTurns = Array.isArray(history)
      ? history
          .filter(
            (m: { role?: string; content?: string }) =>
              (m.role === "user" || m.role === "assistant") && m.content
          )
          .slice(-10)
          .map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          }))
      : [];

    const res = await fetch(GROQ_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_TEXT_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...priorTurns,
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const detail = data?.error?.message ?? JSON.stringify(data);
      console.error("Groq chat failed:", detail);
      return NextResponse.json(
        { error: `AI request failed: ${detail}`.slice(0, 250) },
        { status: 502 }
      );
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      content,
      tokens_used: data.usage?.total_tokens ?? null,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}