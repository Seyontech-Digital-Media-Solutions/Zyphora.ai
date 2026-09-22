import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=linkedin_denied`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=linkedin_missing_code`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=linkedin_state_mismatch`);
  }

  try {
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${APP_URL}/api/integrations/linkedin/callback`,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });

    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      console.error("LinkedIn token exchange failed:", detail);
      return NextResponse.redirect(`${APP_URL}/integrations?error=linkedin_token_exchange`);
    }

    const tokenData = await tokenRes.json();
    const { access_token, expires_in } = tokenData;

    // Requires the "profile" (or legacy r_liteprofile) scope granted at authorize time.
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    let accountName: string | null = null;
    let memberId: string | null = null;
    if (profileRes.ok) {
      const profileData = await profileRes.json();
      accountName = profileData?.name ?? null;
      memberId = profileData?.sub ?? null;
    } else {
      console.error("LinkedIn profile fetch failed:", await profileRes.text());
    }

    const serviceClient = await createServiceClient();
    const { error: dbError } = await serviceClient
      .from("connected_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "linkedin",
          account_name: accountName,
          platform_account_id: memberId,
          access_token,
          refresh_token: null, // LinkedIn's default token type doesn't issue one
          token_expires_at: expires_in
            ? new Date(Date.now() + expires_in * 1000).toISOString()
            : null,
          is_active: true,
        },
        { onConflict: "user_id,platform" }
      );

    if (dbError) {
      console.error("LinkedIn connected_accounts upsert failed:", dbError);
      return NextResponse.redirect(`${APP_URL}/integrations?error=linkedin_save_failed`);
    }

    return NextResponse.redirect(`${APP_URL}/integrations?connected=linkedin`);
  } catch (err) {
    console.error("LinkedIn OAuth callback error:", err);
    return NextResponse.redirect(`${APP_URL}/integrations?error=linkedin_unknown`);
  }
}