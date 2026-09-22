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
    // Step 1: exchange code for a short-lived user token (same Facebook app).
    const redirectUri = `${APP_URL}/api/integrations/instagram/callback`;
    const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", process.env.FACEBOOK_CLIENT_ID!);
    tokenUrl.searchParams.set("client_secret", process.env.FACEBOOK_CLIENT_SECRET!);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString());
    if (!tokenRes.ok) {
      console.error("Instagram (FB) token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(`${APP_URL}/integrations?error=instagram_token_exchange`);
    }
    const tokenData = await tokenRes.json();
    const userToken: string = tokenData.access_token;

    // Step 2: find a Page this user manages that has a linked Instagram
    // Business Account — that link is what makes publishing possible.
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${userToken}`
    );
    if (!pagesRes.ok) {
      console.error("Instagram pages fetch failed:", await pagesRes.text());
      return NextResponse.redirect(`${APP_URL}/integrations?error=instagram_no_pages`);
    }
    const pagesData = await pagesRes.json();

    let igAccountId: string | null = null;
    let pageAccessToken: string | null = null;

    for (const page of pagesData?.data ?? []) {
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      );
      if (!igRes.ok) continue;
      const igData = await igRes.json();
      if (igData.instagram_business_account?.id) {
        igAccountId = igData.instagram_business_account.id;
        pageAccessToken = page.access_token;
        break;
      }
    }

    if (!igAccountId || !pageAccessToken) {
      return NextResponse.redirect(`${APP_URL}/integrations?error=instagram_no_business_account`);
    }

    // Step 3: fetch the IG username to show in the UI.
    const igProfileRes = await fetch(
      `https://graph.facebook.com/v19.0/${igAccountId}?fields=username&access_token=${pageAccessToken}`
    );
    let username: string | null = null;
    if (igProfileRes.ok) {
      const igProfileData = await igProfileRes.json();
      username = igProfileData?.username ?? null;
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
          access_token: pageAccessToken,
          refresh_token: null,
          token_expires_at: null,
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