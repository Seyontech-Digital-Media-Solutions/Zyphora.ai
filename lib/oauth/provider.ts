import { createHash, randomBytes } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

const CODE_TTL_MS = 10 * 60 * 1000; // authorization codes expire in 10 minutes
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000; // access tokens last 1 hour
// refresh tokens don't expire here — revoke via Disconnect instead; add an expiry later if you want one

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function randomToken(prefix: string): string {
  return `${prefix}${randomBytes(32).toString("hex")}`;
}

// ---------- The one static client (Zapier) — validated against env vars, not a DB row ----------

export function validateClientId(clientId: string): boolean {
  return clientId === process.env.ZAPIER_OAUTH_CLIENT_ID;
}

export function validateClientSecret(clientSecret: string): boolean {
  return clientSecret === process.env.ZAPIER_OAUTH_CLIENT_SECRET;
}

export function validateRedirectUri(redirectUri: string): boolean {
  // Zapier gives you one fixed callback URL when you create the OAuth2 connection
  // in "API by Zapier" (shown on their setup page, looks like:
  // https://zapier.com/dashboard/auth/oauth/return/App235435CLIAPI/ )
  const allowed = (process.env.ZAPIER_OAUTH_REDIRECT_URI ?? "").split(",").map((s) => s.trim());
  return allowed.includes(redirectUri);
}

// ---------- Authorization code flow ----------

export async function issueAuthorizationCode(params: {
  userId: string;
  redirectUri: string;
  scope?: string;
}) {
  const code = randomToken("zyph_code_");
  const serviceClient = await createServiceClient();

  const { error } = await serviceClient.from("oauth_authorization_codes").insert({
    code,
    user_id: params.userId,
    redirect_uri: params.redirectUri,
    scope: params.scope ?? null,
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });

  if (error) throw new Error(`Failed to issue authorization code: ${error.message}`);
  return code;
}

export async function exchangeAuthorizationCode(params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}) {
  if (!validateClientId(params.clientId) || !validateClientSecret(params.clientSecret)) {
    throw new Error("invalid_client");
  }

  const serviceClient = await createServiceClient();
  const { data: codeRow } = await serviceClient
    .from("oauth_authorization_codes")
    .select("*")
    .eq("code", params.code)
    .single();

  if (
    !codeRow ||
    codeRow.used_at ||
    codeRow.redirect_uri !== params.redirectUri ||
    new Date(codeRow.expires_at).getTime() < Date.now()
  ) {
    throw new Error("invalid_grant");
  }

  await serviceClient
    .from("oauth_authorization_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("code", params.code);

  return issueTokenPair({ userId: codeRow.user_id, scope: codeRow.scope });
}

export async function exchangeRefreshToken(params: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}) {
  if (!validateClientId(params.clientId) || !validateClientSecret(params.clientSecret)) {
    throw new Error("invalid_client");
  }

  const serviceClient = await createServiceClient();
  const refreshHash = hash(params.refreshToken);

  const { data: tokenRow } = await serviceClient
    .from("oauth_access_tokens")
    .select("*")
    .eq("refresh_token_hash", refreshHash)
    .single();

  if (!tokenRow || tokenRow.revoked_at) throw new Error("invalid_grant");

  // Revoke the old pair and issue a fresh one (rotation).
  await serviceClient
    .from("oauth_access_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", tokenRow.id);

  return issueTokenPair({ userId: tokenRow.user_id, scope: tokenRow.scope });
}

async function issueTokenPair(params: { userId: string; scope: string | null }) {
  const accessToken = randomToken("zyph_at_");
  const refreshToken = randomToken("zyph_rt_");
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS);

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient.from("oauth_access_tokens").insert({
    access_token_hash: hash(accessToken),
    refresh_token_hash: hash(refreshToken),
    user_id: params.userId,
    scope: params.scope,
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw new Error(`Failed to issue tokens: ${error.message}`);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "bearer",
    expires_in: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
    scope: params.scope ?? undefined,
  };
}

// ---------- Verifying an incoming access token (used by /api/v1/auth/test and future endpoints) ----------

export async function verifyAccessToken(accessToken: string) {
  const serviceClient = await createServiceClient();
  const { data } = await serviceClient
    .from("oauth_access_tokens")
    .select("user_id, scope, expires_at, revoked_at")
    .eq("access_token_hash", hash(accessToken))
    .single();

  if (!data || data.revoked_at || new Date(data.expires_at).getTime() < Date.now()) {
    return null;
  }

  return { userId: data.user_id, scope: data.scope };
}

// ---------- For the Integrations card: does this user currently have an active connection? ----------

export async function getActiveTokenForUser(userId: string) {
  const serviceClient = await createServiceClient();
  const { data } = await serviceClient
    .from("oauth_access_tokens")
    .select("id, created_at, expires_at, revoked_at")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

export async function revokeAllTokensForUser(userId: string) {
  const serviceClient = await createServiceClient();
  await serviceClient
    .from("oauth_access_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("revoked_at", null);
}