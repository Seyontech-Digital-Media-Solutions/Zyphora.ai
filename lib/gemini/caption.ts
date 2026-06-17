export interface CaptionResult {
  imageDescription: string;
  caption: string;
  hashtags: string[];
  platformVersions: {
    twitter: string;
    linkedin: string;
    instagram: string;
  };
  _demo?: boolean;
  _error?: string;
}

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Prompt builders ────────────────────────────────────────────────────────

export function buildVisionPrompt(tone: string, platforms: string[]): string {
  return `You are a professional social media content writer.

Analyze this image carefully. Read ALL visible text — brand name, services, prices, taglines, offers.
Write captions that are DIRECTLY about what you see.

Tone: ${tone}
Platforms: ${platforms.join(", ")}

CRITICAL INSTRUCTIONS FOR JSON OUTPUT:
- Return ONLY a raw JSON object
- Do NOT use markdown, code fences, backticks, or triple backticks
- Do NOT write anything before or after the JSON
- All string values must use straight double quotes only
- Do NOT use smart/curly quotes inside values
- Escape any double quotes inside string values with backslash
- For currency symbols like rupee, dollar etc — write them as plain text words (e.g. "Rs 25000" not "₹25,000") to avoid encoding issues
- Keep each platform version on a single line (no literal newlines inside string values — use \\n if needed)

Return this exact structure:
{"imageDescription":"...","caption":"...","hashtags":["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10"],"platformVersions":{"twitter":"...","linkedin":"...","instagram":"..."}}

Rules:
- caption: main caption about the actual image content
- hashtags: 10 tags directly relevant to the image subject (NOT generic #AI #Tech #Startup unless image is about those)
- twitter: under 280 characters
- linkedin: professional post, 2-3 sentences
- instagram: engaging with relevant emojis`;
}

export function buildTextPrompt(
  topic: string,
  tone: string,
  platforms: string[]
): string {
  return `You are a professional social media content writer.

Write social media captions for this topic: "${topic}"
Tone: ${tone}
Platforms: ${platforms.join(", ")}

CRITICAL: Return ONLY raw JSON — no markdown, no code fences, no backticks, nothing before or after.
All strings must use straight double quotes. No smart/curly quotes. No literal newlines inside strings.

{"imageDescription":"","caption":"...","hashtags":["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10"],"platformVersions":{"twitter":"under 280 chars","linkedin":"professional post","instagram":"engaging with emojis"}}`;
}

// ─── Robust JSON parser ──────────────────────────────────────────────────────

function cleanRawText(raw: string): string {
  return raw
    // Strip markdown fences (```json ... ``` or ``` ... ```)
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function extractJsonBoundaries(text: string): string | null {
  // Try to find the first balanced JSON object in the string. This
  // handles cases where the model emits surrounding text or extra braces.
  const start = text.indexOf("{");
  if (start === -1) return null;

  let inString = false;
  let escape = false;
  let depth = 0;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === "\\") {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

function repairJson(raw: string): string {
  return (
    raw
      // Normalize curly/smart quotes to straight quotes
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      // Remove control characters except tab/newline/CR
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      // Remove trailing commas before } or ]
      .replace(/,\s*([}\]])/g, "$1")
      // Replace literal newlines inside strings with \n escape
      // (basic heuristic: inside double-quoted segments)
      .replace(/"((?:[^"\\]|\\.)*)"/g, (_match, inner) => {
        const fixed = inner.replace(/\n/g, "\\n").replace(/\r/g, "");
        return `"${fixed}"`;
      })
      // Convert simple single-quoted strings to double quotes when safe
      // Example: {'key':'value'} -> {"key":"value"}
      .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')
  );
}

function tryParse(text: string): CaptionResult | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && "caption" in parsed) {
      return parsed as CaptionResult;
    }
    return null;
  } catch {
    return null;
  }
}

function extractFieldsManually(raw: string): Partial<CaptionResult> | null {
  // Fallback: pull fields out with regex when JSON.parse fails entirely
  const get = (key: string): string => {
    const m = raw.match(new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
    return m ? m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"') : "";
  };

  const getArray = (key: string): string[] => {
    const m = raw.match(new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]+)\\]`));
    if (!m) return [];
    return m[1]
      .split(",")
      .map((s) => s.trim().replace(/^"|"$/g, "").trim())
      .filter(Boolean);
  };

  const caption = get("caption");
  if (!caption) return null; // nothing useful found

  // Try to pull nested platformVersions if present
  const pvMatch = raw.match(/"platformVersions"\s*:\s*\{([\s\S]*?)\}/);
  const platformVersions = {
    twitter: get("twitter") || "",
    linkedin: get("linkedin") || "",
    instagram: get("instagram") || "",
  };

  if (pvMatch) {
    const pvRaw = pvMatch[1];
    const getPv = (k: string) => {
      const m = pvRaw.match(new RegExp(`"${k}"\\s*:\\s*"((?:[^"\\]|\\.)*)"`));
      return m ? m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"') : "";
    };
    platformVersions.twitter = platformVersions.twitter || getPv("twitter");
    platformVersions.linkedin = platformVersions.linkedin || getPv("linkedin");
    platformVersions.instagram = platformVersions.instagram || getPv("instagram");
  }

  return {
    imageDescription: get("imageDescription"),
    caption,
    hashtags: getArray("hashtags"),
    platformVersions,
  };
}

function normalizeHashtag(tag: string): string {
  const t = tag.trim().replace(/^#+/, "");
  return t ? `#${t}` : "";
}

function sanitizeString(val: unknown): string {
  if (typeof val !== "string") return "";
  const t = val.trim();
  // Reject if the "caption" is actually a raw JSON blob
  if (t.startsWith("{") && t.includes('"caption"')) return "";
  return t;
}

function isNestedJson(val: unknown): val is string {
  if (typeof val !== "string") return false;
  const t = val.trim();
  return (
    (t.startsWith("{") || t.startsWith("```")) &&
    t.includes("imageDescription")
  );
}

export function parseGeminiResponse(rawText: string): CaptionResult {
  // ── Pass 1: clean and attempt direct parse ─────────────────────────────
  const cleaned = cleanRawText(rawText);
  const jsonStr = extractJsonBoundaries(cleaned);

  if (jsonStr) {
    let result = tryParse(jsonStr);

    // ── Pass 2: repair and retry ─────────────────────────────────────────
    if (!result) {
      const repaired = repairJson(jsonStr);
      result = tryParse(repaired);
    }

    if (result) {
      // Unwrap double-encoded JSON
      if (isNestedJson(result.caption)) {
        return parseGeminiResponse(result.caption as string);
      }
      const tw = result.platformVersions?.twitter;
      const li = result.platformVersions?.linkedin;
      const ig = result.platformVersions?.instagram;
      if (isNestedJson(tw) || isNestedJson(li) || isNestedJson(ig)) {
        const nested = [tw, li, ig].find(isNestedJson) as string;
        return parseGeminiResponse(nested);
      }

      const caption = sanitizeString(result.caption);
      const hashtags = (result.hashtags ?? [])
        .map(normalizeHashtag)
        .filter(Boolean);

      return {
        imageDescription: sanitizeString(result.imageDescription),
        caption,
        hashtags,
        platformVersions: {
          twitter: sanitizeString(tw) || caption,
          linkedin: sanitizeString(li) || caption,
          instagram: sanitizeString(ig) || caption,
        },
      };
    }
  }

  // ── Pass 3: manual regex extraction ─────────────────────────────────────
  console.warn("[caption] JSON.parse failed — attempting regex extraction");
  const manual = extractFieldsManually(rawText);
  if (manual && manual.caption) {
    const hashtags = (manual.hashtags ?? [])
      .map(normalizeHashtag)
      .filter(Boolean);
    const caption = sanitizeString(manual.caption);
    return {
      imageDescription: sanitizeString(manual.imageDescription),
      caption,
      hashtags: hashtags.length ? hashtags : ["#content", "#socialmedia"],
      platformVersions: {
        twitter:
          sanitizeString(manual.platformVersions?.twitter) || caption,
        linkedin:
          sanitizeString(manual.platformVersions?.linkedin) || caption,
        instagram:
          sanitizeString(manual.platformVersions?.instagram) || caption,
      },
    };
  }

  // ── Pass 4: surface raw text rather than a useless error message ─────────
  console.error("[caption] All parse attempts failed. Raw:", rawText);
  const safeText =
    rawText.trim().startsWith("{")
      ? "Could not parse AI response. Please try generating again."
      : rawText.slice(0, 200);

  return {
    imageDescription: "",
    caption: safeText,
    hashtags: ["#content", "#socialmedia"],
    platformVersions: {
      twitter: safeText.slice(0, 280),
      linkedin: safeText,
      instagram: safeText,
    },
    _error: "parse_failed",
  };
}

// ─── Fallback / demo mode ────────────────────────────────────────────────────

export function getFallbackResponse(): CaptionResult {
  return {
    imageDescription: "No GEMINI_API_KEY configured",
    caption:
      "[DEMO MODE] Add your free Gemini API key to generate real captions. Get it at aistudio.google.com",
    hashtags: ["#AddGeminiKey", "#FreeAPIKey", "#AICaption"],
    platformVersions: {
      twitter:
        "[DEMO] Add GEMINI_API_KEY to .env.local → real captions here",
      linkedin:
        "[DEMO MODE] Add your free Gemini API key to .env.local for real captions.",
      instagram: "[DEMO] Add GEMINI_API_KEY for real captions 🔑",
    },
    _demo: true,
  };
}

// ─── Core API caller ─────────────────────────────────────────────────────────

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

async function geminiGenerate(
  apiKey: string,
  parts: GeminiPart[]
): Promise<string> {
  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(
          apiKey.trim()
        )}`;

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.6,   // lower = more predictable JSON output
              maxOutputTokens: 1200,
            },
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          const msg = data?.error?.message ?? JSON.stringify(data);
          const status = res.status;

          if ((status === 429 || status === 503) && attempt < maxRetries) {
            const backoffMs = attempt * 1500;
            console.warn(
              `[Gemini] ${model} → ${status}. Retry ${attempt}/${maxRetries - 1} in ${backoffMs}ms…`
            );
            await delay(backoffMs);
            continue;
          }

          throw new Error(`[${status}] ${msg}`);
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof text === "string" && text.length > 0) {
          console.log(`[Gemini] ✓ Model: ${model}`);
          return text;
        }

        throw new Error("Empty text candidate in Gemini response");
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (
          lastError.message.includes("[404]") ||
          lastError.message.toLowerCase().includes("not found")
        ) {
          console.warn(`[Gemini] Model "${model}" not found — skipping`);
          break;
        }

        console.error(
          `[Gemini] ${model} attempt ${attempt}/${maxRetries}:`,
          lastError.message
        );
      }
    }
  }

  throw lastError ?? new Error("All Gemini models failed");
}

// ─── Public API helpers ──────────────────────────────────────────────────────

export async function callGeminiVision(
  apiKey: string,
  base64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  return geminiGenerate(apiKey, [
    { inline_data: { mime_type: mimeType, data: base64 } },
    { text: prompt },
  ]);
}

export async function callGeminiText(
  apiKey: string,
  prompt: string
): Promise<string> {
  return geminiGenerate(apiKey, [{ text: prompt }]);
}

// ─── Error formatter ─────────────────────────────────────────────────────────

export function formatGeminiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes("429") || msg.includes("quota")) {
    return "Gemini quota exceeded — wait a minute and try again.";
  }
  if (
    msg.includes("503") ||
    msg.includes("overloaded") ||
    msg.includes("high demand") ||
    msg.includes("temporarily")
  ) {
    return "Gemini is temporarily overloaded. Please try again in a moment.";
  }
  if (msg.includes("401") || msg.includes("UNAUTHENTICATED")) {
    return (
      "Gemini API key rejected. Copy your key fresh from AI Studio " +
      "(aistudio.google.com). Keys start with AIzaSy..."
    );
  }
  if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
    return "Gemini model not found — retrying with fallback model automatically.";
  }
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    return "Network error — check your internet connection and try again.";
  }

  return msg.slice(0, 250);
}