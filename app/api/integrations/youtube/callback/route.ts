import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, getMyChannel } from "@/lib/integrations/youtube";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    // Google uses "access_denied" when the user cancels the consent screen.
    return NextResponse.redirect(`${APP_URL}/integrations?error=youtube_denied`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=youtube_missing_code`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=youtube_state_mismatch`);
  }

  try {
    const redirectUri = `${APP_URL}/api/integrations/youtube/callback`;
    const tokenData = await exchangeCodeForTokens(code, redirectUri);

    if (!tokenData.refresh_token) {
      // Happens if the user previously connected and Google didn't re-issue
      // a refresh_token. prompt=consent in route.ts should prevent this, but
      // guard anyway since publishing is impossible without one.
      console.error("Google did not return a refresh_token on this connect.");
      return NextResponse.redirect(`${APP_URL}/integrations?error=youtube_no_refresh_token`);
    }

    const channel = await getMyChannel(tokenData.access_token);
    if (!channel) {
      return NextResponse.redirect(`${APP_URL}/integrations?error=youtube_no_channel`);
    }

    const serviceClient = await createServiceClient();
    const { error: dbError } = await serviceClient
      .from("connected_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "youtube",
          account_name: channel.title,
          platform_account_id: channel.channelId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          is_active: true,
        },
        { onConflict: "user_id,platform" }
      );

    if (dbError) {
      console.error("YouTube connected_accounts upsert failed:", dbError);
      return NextResponse.redirect(`${APP_URL}/integrations?error=youtube_save_failed`);
    }

    return NextResponse.redirect(`${APP_URL}/integrations?connected=youtube`);
  } catch (err) {
    console.error("YouTube OAuth callback error:", err);
    return NextResponse.redirect(`${APP_URL}/integrations?error=youtube_unknown`);
  }
}