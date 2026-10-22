import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const IG_GRAPH = "https://graph.instagram.com/v23.0";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // Instagram can append "#_" to the code; strip it defensively.
  const code = searchParams.get("code")?.replace(/#_$/, "") ?? null;
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=instagram_denied`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=instagram_missing_code`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=instagram_state_mismatch`);
  }

  try {
    const redirectUri = `${APP_URL}/api/integrations/instagram/callback`;

    // Step 1: exchange the code for a short-lived Instagram user token (POST, form-encoded).
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID!,
        client_secret: process.env.INSTAGRAM_APP_SECRET!,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });
    if (!tokenRes.ok) {
      console.error("Instagram token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(`${APP_URL}/integrations?error=instagram_token_exchange`);
    }
    const tokenJson = await tokenRes.json();
    const shortToken: string | undefined =
      tokenJson.access_token ?? tokenJson.data?.[0]?.access_token;
    const fallbackUserId = String(tokenJson.user_id ?? tokenJson.data?.[0]?.user_id ?? "");
    if (!shortToken) {
      console.error("Instagram token response had no access_token:", tokenJson);
      return NextResponse.redirect(`${APP_URL}/integrations?error=instagram_token_exchange`);
    }

    // Step 2: swap for a long-lived token (about 60 days).
    const longUrl = new URL("https://graph.instagram.com/access_token");
    longUrl.searchParams.set("grant_type", "ig_exchange_token");
    longUrl.searchParams.set("client_secret", process.env.INSTAGRAM_APP_SECRET!);
    longUrl.searchParams.set("access_token", shortToken);

    const longRes = await fetch(longUrl.toString());
    if (!longRes.ok) {
      console.error("Instagram long-lived exchange failed:", await longRes.text());
      return NextResponse.redirect(`${APP_URL}/integrations?error=instagram_token_exchange`);
    }
    const longJson = await longRes.json();
    const accessToken: string = longJson.access_token;
    const expiresIn: number = longJson.expires_in ?? 60 * 24 * 3600;

    // Step 3: fetch the professional account id and username.
    const profileRes = await fetch(
      `${IG_GRAPH}/me?fields=user_id,username&access_token=${accessToken}`
    );
    if (!profileRes.ok) {
      console.error("Instagram profile fetch failed:", await profileRes.text());
      return NextResponse.redirect(`${APP_URL}/integrations?error=instagram_profile_failed`);
    }
    const profile = await profileRes.json();
    const igAccountId: string = String(profile.user_id ?? fallbackUserId);
    const username: string | null = profile.username ?? null;

    if (!igAccountId) {
      return NextResponse.redirect(`${APP_URL}/integrations?error=instagram_profile_failed`);
    }

    const serviceClient = await createServiceClient();
    const { error: dbError } = await serviceClient
      .from("connected_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "instagram",
          account_name: username ? `@${username}` : null,
          platform_account_id: igAccountId,
          access_token: accessToken,
          refresh_token: null,
          token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
          is_active: true,
        },
        { onConflict: "user_id,platform" }
      );

    if (dbError) {
      console.error("Instagram connected_accounts upsert failed:", dbError);
      return NextResponse.redirect(`${APP_URL}/integrations?error=instagram_save_failed`);
    }

    return NextResponse.redirect(`${APP_URL}/integrations?connected=instagram`);
  } catch (err) {
    console.error("Instagram OAuth callback error:", err);
    return NextResponse.redirect(`${APP_URL}/integrations?error=instagram_unknown`);
  }
}