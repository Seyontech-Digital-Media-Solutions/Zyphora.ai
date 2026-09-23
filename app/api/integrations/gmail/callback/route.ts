import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=gmail_denied`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=gmail_missing_code`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=gmail_state_mismatch`);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${APP_URL}/api/integrations/gmail/callback`,
        client_id: process.env.GMAIL_CLIENT_ID!,
        client_secret: process.env.GMAIL_CLIENT_SECRET!,
      }),
    });

    if (!tokenRes.ok) {
      console.error("Gmail token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(`${APP_URL}/integrations?error=gmail_token_exchange`);
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    let email: string | null = null;
    if (profileRes.ok) {
      const profileData = await profileRes.json();
      email = profileData?.email ?? null;
    }

    if (!refresh_token) {
      // Google only issues a refresh token on the FIRST consent. If the user
      // had already granted access before and this fires again without one,
      // sending won't keep working past the ~1hr access token lifetime.
      console.warn(
        "Gmail OAuth: no refresh_token returned — user may need to revoke access at myaccount.google.com/permissions and reconnect."
      );
    }

    const serviceClient = await createServiceClient();
    const { error: dbError } = await serviceClient
      .from("connected_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "gmail",
          account_name: email,
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
      console.error("Gmail connected_accounts upsert failed:", dbError);
      return NextResponse.redirect(`${APP_URL}/integrations?error=gmail_save_failed`);
    }

    return NextResponse.redirect(`${APP_URL}/integrations?connected=gmail`);
  } catch (err) {
    console.error("Gmail OAuth callback error:", err);
    return NextResponse.redirect(`${APP_URL}/integrations?error=gmail_unknown`);
  }
}