import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=airtable_denied`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=airtable_missing_code`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=airtable_state_mismatch`);
  }

  const codeVerifier = request.cookies.get("airtable_code_verifier")?.value;
  if (!codeVerifier) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=airtable_missing_verifier`);
  }

  try {
    const basicAuth = Buffer.from(
      `${process.env.AIRTABLE_CLIENT_ID}:${process.env.AIRTABLE_CLIENT_SECRET}`
    ).toString("base64");

    const tokenRes = await fetch("https://airtable.com/oauth2/v1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${APP_URL}/api/integrations/airtable/callback`,
        client_id: process.env.AIRTABLE_CLIENT_ID!,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenRes.ok) {
      console.error("Airtable token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(`${APP_URL}/integrations?error=airtable_token_exchange`);
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Fetch the list of bases the user granted access to, so the UI can let
    // them pick which one to sync content into later.
    const basesRes = await fetch("https://api.airtable.com/v0/meta/bases", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    let firstBaseId: string | null = null;
    let firstBaseName: string | null = null;
    if (basesRes.ok) {
      const basesData = await basesRes.json();
      const firstBase = basesData?.bases?.[0];
      firstBaseId = firstBase?.id ?? null;
      firstBaseName = firstBase?.name ?? null;
    }

    const serviceClient = await createServiceClient();
    const { error: dbError } = await serviceClient
      .from("connected_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "airtable",
          account_name: firstBaseName,
          platform_account_id: firstBaseId,
          access_token,
          refresh_token: refresh_token ?? null,
          token_expires_at: expires_in
            ? new Date(Date.now() + expires_in * 1000).toISOString()
            : null,
          is_active: true,
          platform_config: { base_id: firstBaseId },
        },
        { onConflict: "user_id,platform" }
      );

    if (dbError) {
      console.error("Airtable connected_accounts upsert failed:", dbError);
      return NextResponse.redirect(`${APP_URL}/integrations?error=airtable_save_failed`);
    }

    const response = NextResponse.redirect(`${APP_URL}/integrations?connected=airtable`);
    response.cookies.delete("airtable_code_verifier");
    return response;
  } catch (err) {
    console.error("Airtable OAuth callback error:", err);
    return NextResponse.redirect(`${APP_URL}/integrations?error=airtable_unknown`);
  }
}