import { NextRequest, NextResponse } from "next/server";
import { mockChatResponse } from "@/lib/mock/ai";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    const response = await mockChatResponse(message);
    // TODO: Replace with real streaming Anthropic API call
    return NextResponse.json({ content: response });
  } catch {
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
