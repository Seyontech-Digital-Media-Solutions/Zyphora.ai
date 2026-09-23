import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=slack_denied`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=slack_missing_code`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=slack_state_mismatch`);
  }

  try {
    const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: `${APP_URL}/api/integrations/slack/callback`,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.ok) {
      console.error("Slack token exchange failed:", tokenData);
      return NextResponse.redirect(`${APP_URL}/integrations?error=slack_token_exchange`);
    }

    const botToken: string = tokenData.access_token;
    const teamName: string = tokenData.team?.name ?? null;
    const teamId: string = tokenData.team?.id ?? null;

    const serviceClient = await createServiceClient();
    const { error: dbError } = await serviceClient
      .from("connected_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "slack",
          account_name: teamName,
          platform_account_id: teamId,
          access_token: botToken,
          refresh_token: null,
          token_expires_at: null, // Slack bot tokens don't expire under normal OAuth v2
          is_active: true,
          platform_config: {},
        },
        { onConflict: "user_id,platform" }
      );

    if (dbError) {
      console.error("Slack connected_accounts upsert failed:", dbError);
      return NextResponse.redirect(`${APP_URL}/integrations?error=slack_save_failed`);
    }

    return NextResponse.redirect(`${APP_URL}/integrations?connected=slack`);
  } catch (err) {
    console.error("Slack OAuth callback error:", err);
    return NextResponse.redirect(`${APP_URL}/integrations?error=slack_unknown`);
  }
}