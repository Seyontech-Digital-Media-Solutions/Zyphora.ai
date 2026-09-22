import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
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
    // Step 1: exchange the code for a short-lived access token.
    const form = new URLSearchParams({
      client_id: process.env.INSTAGRAM_CLIENT_ID!,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
      grant_type: "authorization_code",
      redirect_uri: `${APP_URL}/api/integrations/instagram/callback`,
      code,
    });

    const shortTokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });

    if (!shortTokenRes.ok) {
      const detail = await shortTokenRes.text();
      console.error("Instagram token exchange failed:", detail);
      return NextResponse.redirect(`${APP_URL}/integrations?error=instagram_token_exchange`);
    }

    const shortTokenData = await shortTokenRes.json();
    const shortLivedToken: string = shortTokenData.access_token;

    // Step 2: upgrade to a long-lived token (~60 days) so we don't have to
    // re-auth the user every hour.
    let accessToken = shortLivedToken;
    let expiresInSeconds = 3600;

    const longTokenRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${shortLivedToken}`
    );
    if (longTokenRes.ok) {
      const longTokenData = await longTokenRes.json();
      accessToken = longTokenData.access_token;
      expiresInSeconds = longTokenData.expires_in ?? expiresInSeconds;
    } else {
      console.error("Instagram long-lived token upgrade failed:", await longTokenRes.text());
      // Not fatal — fall back to the short-lived token rather than failing the whole connect.
    }

    // Step 3: fetch the username to show in the UI.
    const profileRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
    );
    let username: string | null = null;
    if (profileRes.ok) {
      const profileData = await profileRes.json();
      username = profileData?.username ?? null;
    } else {
      console.error("Instagram profile fetch failed:", await profileRes.text());
    }

    const serviceClient = await createServiceClient();
    const { error: dbError } = await serviceClient
      .from("connected_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "instagram",
          account_name: username ? `@${username}` : null,
          access_token: accessToken,
          refresh_token: null, // Instagram uses re-exchange, not a refresh token
          token_expires_at: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
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