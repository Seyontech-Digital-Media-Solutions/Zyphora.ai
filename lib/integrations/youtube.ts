// Low-level Google/YouTube API helpers: token exchange, refresh, channel info.

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string; // only present on the FIRST consent (or when prompt=consent)
  expires_in: number; // seconds
  scope: string;
  token_type: string;
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${await res.text()}`);
  }
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    grant_type: "refresh_token",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${await res.text()}`);
  }
  // Note: refresh responses do NOT include a new refresh_token — keep reusing the original.
  return res.json();
}

export interface YouTubeChannel {
  channelId: string;
  title: string;
  thumbnailUrl: string | null;
}

export async function getMyChannel(accessToken: string): Promise<YouTubeChannel | null> {
  const res = await fetch(
    `${YOUTUBE_API}/channels?part=snippet&mine=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    throw new Error(`YouTube channel lookup failed: ${await res.text()}`);
  }
  const data = await res.json();
  const channel = data?.items?.[0];
  if (!channel) return null;

  return {
    channelId: channel.id,
    title: channel.snippet?.title ?? "YouTube Channel",
    thumbnailUrl: channel.snippet?.thumbnails?.default?.url ?? null,
  };
}