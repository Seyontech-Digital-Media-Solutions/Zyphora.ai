import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=twitter_denied`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=twitter_missing_code`);
  }

  // The state param must match the currently logged-in user (basic CSRF check).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=twitter_state_mismatch`);
  }

  const codeVerifier = request.cookies.get("twitter_code_verifier")?.value;
  if (!codeVerifier) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=twitter_missing_verifier`);
  }

  try {
    const basicAuth = Buffer.from(
      `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
    ).toString("base64");

    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${APP_URL}/api/integrations/twitter/callback`,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      console.error("Twitter token exchange failed:", detail);
      return NextResponse.redirect(`${APP_URL}/integrations?error=twitter_token_exchange`);
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    const profileRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!profileRes.ok) {
      const detail = await profileRes.text();
      console.error("Twitter profile fetch failed:", detail);
      return NextResponse.redirect(`${APP_URL}/integrations?error=twitter_profile_fetch`);
    }
    const profileData = await profileRes.json();
    const username = profileData?.data?.username;

    const serviceClient = await createServiceClient();
    const { error: dbError } = await serviceClient
      .from("connected_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "twitter",
          account_name: username ? `@${username}` : null,
          access_token,
          refresh_token: refresh_token ?? null,
          token_expires_at: expires_in
            ? new Date(Date.now() + expires_in * 1000).toISOString()
            : null,
          is_active: true,
        },
        { onConflict: "user_id,platform" }
      );

    if (dbError) {
      console.error("Twitter connected_accounts upsert failed:", dbError);
      return NextResponse.redirect(`${APP_URL}/integrations?error=twitter_save_failed`);
    }

    const response = NextResponse.redirect(`${APP_URL}/integrations?connected=twitter`);
    response.cookies.delete("twitter_code_verifier");
    return response;
  } catch (err) {
    console.error("Twitter OAuth callback error:", err);
    return NextResponse.redirect(`${APP_URL}/integrations?error=twitter_unknown`);
  }
}