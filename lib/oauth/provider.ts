import { createHash, randomBytes } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

const CODE_TTL_MS = 10 * 60 * 1000; // authorization codes expire in 10 minutes
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000; // access tokens last 1 hour

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function randomToken(prefix: string): string {
  return `${prefix}${randomBytes(32).toString("hex")}`;
}

// ---------- Registered OAuth clients (Zapier, n8n, any future one) ----------
// Each is a static credential pair from env vars, same pattern as your other
// platforms' Client ID/Secret — not a DB row, so the secret can be shown
// once at setup time without needing to be re-decryptable later.

interface OAuthClientConfig {
  platform: string; // matches connected_accounts.platform
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
}

function getClients(): OAuthClientConfig[] {
  const clients: OAuthClientConfig[] = [];

  if (process.env.ZAPIER_OAUTH_CLIENT_ID) {
    clients.push({
      platform: "zapier",
      clientId: process.env.ZAPIER_OAUTH_CLIENT_ID,
      clientSecret: process.env.ZAPIER_OAUTH_CLIENT_SECRET ?? "",
      redirectUris: (process.env.ZAPIER_OAUTH_REDIRECT_URI ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }

  if (process.env.N8N_OAUTH_CLIENT_ID) {
    clients.push({
      platform: "n8n",
      clientId: process.env.N8N_OAUTH_CLIENT_ID,
      clientSecret: process.env.N8N_OAUTH_CLIENT_SECRET ?? "",
      redirectUris: (process.env.N8N_OAUTH_REDIRECT_URI ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }

  return clients;
}

export function getClientByClientId(clientId: string): OAuthClientConfig | undefined {
  return getClients().find((c) => c.clientId === clientId);
}

export function validateClientId(clientId: string): boolean {
  return !!getClientByClientId(clientId);
}

export function validateClientSecret(clientId: string, clientSecret: string): boolean {
  const client = getClientByClientId(clientId);
  return !!client && client.clientSecret === clientSecret;
}

export function validateRedirectUri(clientId: string, redirectUri: string): boolean {
  const client = getClientByClientId(clientId);
  return !!client && client.redirectUris.includes(redirectUri);
}

// ---------- Authorization code flow ----------

export async function issueAuthorizationCode(params: {
  userId: string;
  clientId: string;
  redirectUri: string;
  scope?: string;
}) {
  const client = getClientByClientId(params.clientId);
  if (!client) throw new Error("invalid_client");

  const code = randomToken("zyph_code_");
  const serviceClient = await createServiceClient();

  const { error } = await serviceClient.from("oauth_authorization_codes").insert({
    code,
    user_id: params.userId,
    redirect_uri: params.redirectUri,
    scope: params.scope ?? null,
    platform: client.platform,
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
  if (!validateClientId(params.clientId) || !validateClientSecret(params.clientId, params.clientSecret)) {
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

  return issueTokenPair({ userId: codeRow.user_id, scope: codeRow.scope, platform: codeRow.platform });
}

export async function exchangeRefreshToken(params: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}) {
  if (!validateClientId(params.clientId) || !validateClientSecret(params.clientId, params.clientSecret)) {
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

  await serviceClient
    .from("oauth_access_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", tokenRow.id);

  return issueTokenPair({ userId: tokenRow.user_id, scope: tokenRow.scope, platform: tokenRow.platform });
}

async function issueTokenPair(params: { userId: string; scope: string | null; platform: string }) {
  const accessToken = randomToken("zyph_at_");
  const refreshToken = randomToken("zyph_rt_");
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS);

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient.from("oauth_access_tokens").insert({
    access_token_hash: hash(accessToken),
    refresh_token_hash: hash(refreshToken),
    user_id: params.userId,
    scope: params.scope,
    platform: params.platform,
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw new Error(`Failed to issue tokens: ${error.message}`);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "bearer",
    expires_in: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
    scope: params.scope ?? undefined,
    platform: params.platform,
  };
}

// ---------- Verifying an incoming access token ----------

export async function verifyAccessToken(accessToken: string) {
  const serviceClient = await createServiceClient();
  const { data } = await serviceClient
    .from("oauth_access_tokens")
    .select("user_id, scope, platform, expires_at, revoked_at")
    .eq("access_token_hash", hash(accessToken))
    .single();

  if (!data || data.revoked_at || new Date(data.expires_at).getTime() < Date.now()) {
    return null;
  }

  return { userId: data.user_id, scope: data.scope, platform: data.platform };
}

// ---------- For an Integrations card: does this user have an active connection for THIS platform? ----------

export async function getActiveTokenForUser(userId: string, platform: string) {
  const serviceClient = await createServiceClient();
  const { data } = await serviceClient
    .from("oauth_access_tokens")
    .select("id, created_at, expires_at, revoked_at")
    .eq("user_id", userId)
    .eq("platform", platform)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

export async function revokeAllTokensForUser(userId: string, platform: string) {
  const serviceClient = await createServiceClient();
  await serviceClient
    .from("oauth_access_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("platform", platform)
    .is("revoked_at", null);
}