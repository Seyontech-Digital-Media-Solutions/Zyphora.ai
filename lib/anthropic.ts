import Anthropic from "@anthropic-ai/sdk";
import type { BrandVoice, GenerateContentResponse } from "@/types";

function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";

export function buildContentSystemPrompt({
  brandName,
  brandVoice,
  industry,
  platform,
}: {
  brandName: string;
  brandVoice: BrandVoice | string;
  industry: string;
  platform: string;
}) {
  return `You are a professional social media content strategist for ${brandName}.
Brand voice: ${brandVoice}
Industry: ${industry}
Generate content that is authentic, engaging, and optimized for ${platform}.
Return JSON only: { "posts": [{ "platform": string, "content": string, "hashtags": string[], "bestTimeToPost": string }] }`;
}

export async function generateContent({
  prompt,
  platform,
  tone,
  brandName = "Zyphora",
  brandVoice = "professional",
  industry = "technology",
}: {
  prompt: string;
  platform: string;
  tone: string;
  brandName?: string;
  brandVoice?: string;
  industry?: string;
}): Promise<GenerateContentResponse> {
  const system = buildContentSystemPrompt({
    brandName,
    brandVoice: brandVoice || tone,
    industry,
    platform,
  });

  const message = await getClient().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system,
    messages: [
      {
        role: "user",
        content: `Topic: ${prompt}\nTone: ${tone}\nPlatforms: ${platform}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      posts: [
        {
          platform,
          content: text,
          hashtags: [],
          bestTimeToPost: "09:00",
        },
      ],
    };
  }
  return JSON.parse(jsonMatch[0]) as GenerateContentResponse;
}

export async function streamChat({
  messages,
  systemContext,
}: {
  messages: { role: "user" | "assistant"; content: string }[];
  systemContext?: string;
}) {
  return getClient().messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system:
      systemContext ||
      "You are Zyphora AI, a business assistant helping founders with content, strategy, and operations.",
    messages,
  });
}
