import { NextRequest, NextResponse } from "next/server";
import { exchangeAuthorizationCode, exchangeRefreshToken } from "@/lib/oauth/provider";
import { createServiceClient } from "@/lib/supabase/server";

// Standard OAuth2 token endpoint. Zapier calls this twice: once right after
// the user approves (grant_type=authorization_code), and later automatically
// whenever the access token expires (grant_type=refresh_token).
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  let params: Record<string, string>;

  if (contentType.includes("application/json")) {
    params = await request.json();
  } else {
    const form = await request.formData();
    params = Object.fromEntries(form.entries()) as Record<string, string>;
  }

  // Some OAuth clients send client_id/secret via HTTP Basic auth instead of the body.
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

      // Mirror the connection into connected_accounts so your Integrations
      // page (which only reads that table) shows Zapier as "Connected" too.
      // We decode the userId straight out of the access token we just issued
      // instead of re-verifying, since we just created it ourselves above.
      await markZapierConnected(tokens.access_token);

      return NextResponse.json(tokens);
    }

    if (params.grant_type === "refresh_token") {
      const tokens = await exchangeRefreshToken({
        refreshToken: params.refresh_token,
        clientId: params.client_id,
        clientSecret: params.client_secret,
      });
      return NextResponse.json(tokens);
    }

    return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "server_error";
    const status = message === "invalid_client" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

async function markZapierConnected(accessToken: string) {
  const { verifyAccessToken } = await import("@/lib/oauth/provider");
  const verified = await verifyAccessToken(accessToken);
  if (!verified) return;

  const serviceClient = await createServiceClient();
  await serviceClient.from("connected_accounts").upsert(
    {
      user_id: verified.userId,
      platform: "zapier",
      account_name: "Zapier",
      is_active: true,
    },
    { onConflict: "user_id,platform" }
  );
}