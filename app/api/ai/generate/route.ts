import { NextRequest, NextResponse } from "next/server";
import {
  buildTextPrompt,
  buildVisionPrompt,
  callGroqText,
  callGroqVision,
  formatGroqError,
  getFallbackResponse,
  parseGroqResponse,
} from "@/lib/gemini/caption";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    let imageFile: File | null = null;
    let manualPrompt = "";
    let tone = "casual";
    let platforms = ["twitter", "linkedin", "instagram"];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      imageFile = formData.get("image") as File | null;
      manualPrompt = (formData.get("prompt") as string) || "";
      tone = (formData.get("tone") as string) || "casual";
      try {
        platforms = JSON.parse(
          (formData.get("platforms") as string) ||
          '["twitter","linkedin","instagram"]'
        );
      } catch {
        platforms = ["twitter", "linkedin", "instagram"];
      }
    } else {
      const body = await req.json();
      manualPrompt = body.prompt || "";
      tone = body.tone || "casual";
      platforms = body.platforms || ["twitter", "linkedin", "instagram"];
    }

    const apiKey = process.env.GROQ_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(getFallbackResponse());
    }

    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      const mimeType = imageFile.type || "image/jpeg";
      const prompt = buildVisionPrompt(tone, platforms);

      try {
        const rawText = await callGroqVision(apiKey, base64, mimeType, prompt);
        const parsed = parseGroqResponse(rawText);
        return NextResponse.json(parsed);
      } catch (err) {
        console.error("Groq vision error:", err);
        const message = formatGroqError(err);
        return NextResponse.json(
          { error: message, _apiError: true },
          { status: 502 }
        );
      }
    }

    if (manualPrompt) {
      const prompt = buildTextPrompt(manualPrompt, tone, platforms);
      try {
        const rawText = await callGroqText(apiKey, prompt);
        const parsed = parseGroqResponse(rawText);
        return NextResponse.json(parsed);
      } catch (err) {
        console.error("Groq text error:", err);
        const message = formatGroqError(err);
        return NextResponse.json(
          { error: message, _apiError: true },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      { error: "Upload an image or enter a text prompt" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Caption generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate caption" },
      { status: 500 }
    );
  }
}