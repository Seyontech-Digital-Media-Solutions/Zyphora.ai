import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=notion_denied`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=notion_missing_code`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== state) {
    return NextResponse.redirect(`${APP_URL}/integrations?error=notion_state_mismatch`);
  }

  try {
    const basicAuth = Buffer.from(
      `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
    ).toString("base64");

    const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${APP_URL}/api/integrations/notion/callback`,
      }),
    });

    if (!tokenRes.ok) {
      console.error("Notion token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(`${APP_URL}/integrations?error=notion_token_exchange`);
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;
    const workspaceName: string = tokenData.workspace_name ?? null;
    const workspaceId: string = tokenData.workspace_id ?? null;
    // If the user selected a specific page/database when authorizing, Notion
    // returns it here — handy as a default sync target.
    const duplicatedTemplateId = tokenData.duplicated_template_id ?? null;

    const serviceClient = await createServiceClient();
    const { error: dbError } = await serviceClient
      .from("connected_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "notion",
          account_name: workspaceName,
          platform_account_id: workspaceId,
          access_token: accessToken,
          refresh_token: null, // Notion's integration tokens don't expire/refresh
          token_expires_at: null,
          is_active: true,
          platform_config: { duplicated_template_id: duplicatedTemplateId },
        },
        { onConflict: "user_id,platform" }
      );

    if (dbError) {
      console.error("Notion connected_accounts upsert failed:", dbError);
      return NextResponse.redirect(`${APP_URL}/integrations?error=notion_save_failed`);
    }

    return NextResponse.redirect(`${APP_URL}/integrations?connected=notion`);
  } catch (err) {
    console.error("Notion OAuth callback error:", err);
    return NextResponse.redirect(`${APP_URL}/integrations?error=notion_unknown`);
  }
}