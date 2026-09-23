import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";

function base64url(input: Buffer) {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Airtable's OAuth2 requires PKCE.
  const codeVerifier = base64url(randomBytes(64));
  const codeChallenge = base64url(createHash("sha256").update(codeVerifier).digest());
  const scope = "data.records:read data.records:write schema.bases:read";

  const authUrl = `https://airtable.com/oauth2/v1/authorize?client_id=${process.env.AIRTABLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/airtable/callback`
  )}&response_type=code&scope=${encodeURIComponent(scope)}&state=${user.id}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  const response = NextResponse.json({ authUrl });
  response.cookies.set("airtable_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await supabase
    .from("connected_accounts")
    .update({ is_active: false })
    .eq("user_id", user.id)
    .eq("platform", "airtable");

  return NextResponse.json({ success: true });
}