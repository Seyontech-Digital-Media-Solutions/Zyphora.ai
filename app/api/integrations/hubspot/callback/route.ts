import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=hubspot_denied`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=hubspot_missing_code`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=hubspot_state_mismatch`);
  }

  try {
    const tokenRes = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        redirect_uri: `${APP_URL}/api/integrations/hubspot/callback`,
        code,
      }),
    });

    if (!tokenRes.ok) {
      console.error("HubSpot token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(`${APP_URL}/integrations?error=hubspot_token_exchange`);
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Fetch account/portal info to show a friendly name in the UI.
    const accountRes = await fetch(
      "https://api.hubapi.com/account-info/v3/details",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    let portalName: string | null = null;
    let portalId: string | null = null;
    if (accountRes.ok) {
      const accountData = await accountRes.json();
      portalName = accountData?.companyName ?? null;
      portalId = accountData?.portalId ? String(accountData.portalId) : null;
    }

    const serviceClient = await createServiceClient();
    const { error: dbError } = await serviceClient
      .from("connected_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "hubspot",
          account_name: portalName,
          platform_account_id: portalId,
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
      console.error("HubSpot connected_accounts upsert failed:", dbError);
      return NextResponse.redirect(`${APP_URL}/integrations?error=hubspot_save_failed`);
    }

    return NextResponse.redirect(`${APP_URL}/integrations?connected=hubspot`);
  } catch (err) {
    console.error("HubSpot OAuth callback error:", err);
    return NextResponse.redirect(`${APP_URL}/integrations?error=hubspot_unknown`);
  }
}