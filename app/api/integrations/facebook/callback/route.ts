import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=facebook_denied`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=facebook_missing_code`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=facebook_state_mismatch`);
  }

  try {
    // Step 1: exchange the code for a short-lived access token.
    const redirectUri = `${APP_URL}/api/integrations/facebook/callback`;
    const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", process.env.FACEBOOK_CLIENT_ID!);
    tokenUrl.searchParams.set("client_secret", process.env.FACEBOOK_CLIENT_SECRET!);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const shortTokenRes = await fetch(tokenUrl.toString());
    if (!shortTokenRes.ok) {
      const detail = await shortTokenRes.text();
      console.error("Facebook token exchange failed:", detail);
      return NextResponse.redirect(`${APP_URL}/integrations?error=facebook_token_exchange`);
    }
    const shortTokenData = await shortTokenRes.json();
    const shortLivedToken: string = shortTokenData.access_token;

    // Step 2: upgrade to a long-lived token (~60 days) so the user doesn't
    // have to re-auth constantly.
    let accessToken = shortLivedToken;
    let expiresInSeconds = 3600;

    const longTokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
    longTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
    longTokenUrl.searchParams.set("client_id", process.env.FACEBOOK_CLIENT_ID!);
    longTokenUrl.searchParams.set("client_secret", process.env.FACEBOOK_CLIENT_SECRET!);
    longTokenUrl.searchParams.set("fb_exchange_token", shortLivedToken);

    const longTokenRes = await fetch(longTokenUrl.toString());
    if (longTokenRes.ok) {
      const longTokenData = await longTokenRes.json();
      accessToken = longTokenData.access_token;
      expiresInSeconds = longTokenData.expires_in ?? expiresInSeconds;
    } else {
      console.error("Facebook long-lived token upgrade failed:", await longTokenRes.text());
      // Not fatal — fall back to the short-lived token rather than failing the whole connect.
    }

    // Step 3: fetch the profile name to show in the UI.
    const profileRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name&access_token=${accessToken}`
    );
    let name: string | null = null;
    if (profileRes.ok) {
      const profileData = await profileRes.json();
      name = profileData?.name ?? null;
    } else {
      console.error("Facebook profile fetch failed:", await profileRes.text());
    }

    // Step 4: posting to a Page requires that Page's own access token, not
    // the user token — fetch the pages this user manages and use the first one.
    let pageId: string | null = null;
    let pageAccessToken: string | null = null;
    let pageName: string | null = null;

    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
    );
    if (pagesRes.ok) {
      const pagesData = await pagesRes.json();
      const firstPage = pagesData?.data?.[0];
      if (firstPage) {
        pageId = firstPage.id;
        pageAccessToken = firstPage.access_token;
        pageName = firstPage.name;
      }
    } else {
      console.error("Facebook pages fetch failed:", await pagesRes.text());
    }

    if (!pageId || !pageAccessToken) {
      // No Page to post to — still save the connection so the user sees it,
      // but posting will fail until they have/admin a Facebook Page.
      console.warn("Facebook account has no manageable Pages; posting will not work yet.");
    }

    const serviceClient = await createServiceClient();
    const { error: dbError } = await serviceClient
      .from("connected_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "facebook",
          account_name: pageName ?? name,
          platform_account_id: pageId,
          access_token: pageAccessToken ?? accessToken,
          refresh_token: null, // Facebook uses re-exchange, not a refresh token
          token_expires_at: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
          is_active: true,
        },
        { onConflict: "user_id,platform" }
      );

    if (dbError) {
      console.error("Facebook connected_accounts upsert failed:", dbError);
      return NextResponse.redirect(`${APP_URL}/integrations?error=facebook_save_failed`);
    }

    return NextResponse.redirect(`${APP_URL}/integrations?connected=facebook`);
  } catch (err) {
    console.error("Facebook OAuth callback error:", err);
    return NextResponse.redirect(`${APP_URL}/integrations?error=facebook_unknown`);
  }
}