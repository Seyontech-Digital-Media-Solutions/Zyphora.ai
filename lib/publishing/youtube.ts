import { refreshAccessToken } from "@/lib/integrations/youtube";
import { createServiceClient } from "@/lib/supabase/server";
import type { ConnectedAccount } from "@/types";

const UPLOAD_INIT_URL =
  "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";

export interface PublishContentInput {
  caption: string; // used as video title (trimmed to 100 chars) + description
  mediaUrl?: string | null; // a hosted video file (mp4 etc.) — REQUIRED for YouTube
  title?: string | null; // optional explicit title, falls back to caption
  privacyStatus?: "public" | "unlisted" | "private"; // defaults to "public"
}

export interface PublishResult {
  success: boolean;
  platformPostId: string | null;
  error: string | null;
}

/**
 * YouTube has no "post" concept — every publish is a video upload. This uses
 * the resumable upload protocol: (1) POST metadata to get an upload session
 * URL back in the Location header, (2) PUT the actual video bytes to that URL.
 *
 * account.access_token  = current (possibly expired) access token
 * account.refresh_token = long-lived refresh token (saved at connect time)
 */
export async function publishToYouTube(
  account: ConnectedAccount,
  content: PublishContentInput
): Promise<PublishResult> {
  if (!content.mediaUrl) {
    return { success: false, platformPostId: null, error: "YouTube requires a video file — text/image-only posts aren't supported" };
  }
  if (!account.refresh_token) {
    return { success: false, platformPostId: null, error: "YouTube connection is missing a refresh token — reconnect the account" };
  }

  try {
    const accessToken = await getFreshAccessToken(account);

    // Step 1: fetch the source video so we know its size/type to upload.
    const videoRes = await fetch(content.mediaUrl);
    if (!videoRes.ok || !videoRes.body) {
      throw new Error(`Could not fetch source video from mediaUrl: ${videoRes.status}`);
    }
    const contentType = videoRes.headers.get("content-type") ?? "video/mp4";
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

    const title = (content.title ?? content.caption ?? "Untitled").slice(0, 100);
    const description = content.caption ?? "";

    // Step 2: initiate the resumable upload session.
    const initRes = await fetch(UPLOAD_INIT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": contentType,
        "X-Upload-Content-Length": String(videoBuffer.byteLength),
      },
      body: JSON.stringify({
        snippet: { title, description },
        status: { privacyStatus: content.privacyStatus ?? "public" },
      }),
    });

    if (!initRes.ok) {
      throw new Error(`YouTube upload session creation failed: ${await initRes.text()}`);
    }
    const uploadUrl = initRes.headers.get("location");
    if (!uploadUrl) {
      throw new Error("YouTube did not return an upload session URL");
    }

    // Step 3: PUT the actual video bytes to the session URL.
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(videoBuffer.byteLength),
      },
      body: videoBuffer,
    });

    if (!uploadRes.ok) {
      throw new Error(`YouTube video upload failed: ${await uploadRes.text()}`);
    }
    const uploadData = await uploadRes.json();

    return { success: true, platformPostId: uploadData.id, error: null };
  } catch (err) {
    return {
      success: false,
      platformPostId: null,
      error: err instanceof Error ? err.message : "Unknown YouTube publishing error",
    };
  }
}

/**
 * Google access tokens expire after ~1 hour. If the stored one is expired
 * (or close to it), refresh it and persist the new token + expiry so the
 * next publish doesn't need to refresh again.
 */
async function getFreshAccessToken(account: ConnectedAccount): Promise<string> {
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at).getTime() : 0;
  const isExpiredOrSoon = expiresAt - Date.now() < 2 * 60 * 1000; // refresh if <2 min left

  if (!isExpiredOrSoon && account.access_token) {
    return account.access_token;
  }

  const refreshed = await refreshAccessToken(account.refresh_token!);
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  const serviceClient = await createServiceClient();
  await serviceClient
    .from("connected_accounts")
    .update({
      access_token: refreshed.access_token,
      token_expires_at: newExpiresAt,
    })
    .eq("id", account.id);

  return refreshed.access_token;
}