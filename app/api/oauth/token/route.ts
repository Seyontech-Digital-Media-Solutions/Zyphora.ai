import { NextRequest, NextResponse } from "next/server";
import { exchangeAuthorizationCode, exchangeRefreshToken, verifyAccessToken } from "@/lib/oauth/provider";
import { createServiceClient } from "@/lib/supabase/server";

// Shared OAuth2 token endpoint for every external client (Zapier, n8n, ...).
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  let params: Record<string, string>;

  if (contentType.includes("application/json")) {
    params = await request.json();
  } else {
    const form = await request.formData();
    params = Object.fromEntries(form.entries()) as Record<string, string>;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
    const [basicClientId, basicClientSecret] = decoded.split(":");
    params.client_id ??= basicClientId;
    params.client_secret ??= basicClientSecret;
  }

  try {
    if (params.grant_type === "authorization_code") {
      const tokens = await exchangeAuthorizationCode({
        code: params.code,
        clientId: params.client_id,
        clientSecret: params.client_secret,
        redirectUri: params.redirect_uri,
      });

      // Mirror the connection into connected_accounts so the Integrations
      // page (which reads that table) shows the right platform as Connected.
      await markPlatformConnected(tokens.access_token, tokens.platform);

      const { platform, ...publicTokens } = tokens;
      void platform;
      return NextResponse.json(publicTokens);
    }

    if (params.grant_type === "refresh_token") {
      const tokens = await exchangeRefreshToken({
        refreshToken: params.refresh_token,
        clientId: params.client_id,
        clientSecret: params.client_secret,
      });
      const { platform, ...publicTokens } = tokens;
      void platform;
      return NextResponse.json(publicTokens);
    }

    return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "server_error";
    const status = message === "invalid_client" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

const PLATFORM_LABELS: Record<string, string> = {
  zapier: "Zapier",
  n8n: "n8n",
};

async function markPlatformConnected(accessToken: string, platform: string) {
  const verified = await verifyAccessToken(accessToken);
  if (!verified) return;

  const serviceClient = await createServiceClient();
  await serviceClient.from("connected_accounts").upsert(
    {
      user_id: verified.userId,
      platform,
      account_name: PLATFORM_LABELS[platform] ?? platform,
      is_active: true,
    },
    { onConflict: "user_id,platform" }
  );
}