type PublishInput = {
  accessToken: string; // Page access token
  platformAccountId: string | null; // Page ID
  text: string;
  mediaUrls: string[];
};

type PublishResult = { externalId: string };

export async function publishToFacebook({
  accessToken,
  platformAccountId,
  text,
  mediaUrls,
}: PublishInput): Promise<PublishResult> {
  if (!platformAccountId) {
    throw new Error(
      "No Facebook Page connected — the account must admin a Facebook Page to post."
    );
  }

  // No media: simple text post to the Page feed.
  if (mediaUrls.length === 0) {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${platformAccountId}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, access_token: accessToken }),
      }
    );
    if (!res.ok) throw new Error(`Facebook post failed: ${await res.text()}`);
    const data = await res.json();
    return { externalId: data.id };
  }

  // Single video: /videos endpoint.
  const headRes = await fetch(mediaUrls[0], { method: "HEAD" });
  const contentType = headRes.headers.get("content-type") ?? "";
  if (contentType.startsWith("video/")) {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${platformAccountId}/videos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_url: mediaUrls[0],
          description: text,
          access_token: accessToken,
        }),
      }
    );
    if (!res.ok) throw new Error(`Facebook video post failed: ${await res.text()}`);
    const data = await res.json();
    return { externalId: data.id };
  }

  // One or more images: upload each unpublished, then attach to one feed post.
  const attachedMedia: { media_fbid: string }[] = [];
  for (const url of mediaUrls) {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${platformAccountId}/photos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          published: false,
          access_token: accessToken,
        }),
      }
    );
    if (!res.ok) throw new Error(`Facebook photo upload failed: ${await res.text()}`);
    const data = await res.json();
    attachedMedia.push({ media_fbid: data.id });
  }

  const feedRes = await fetch(
    `https://graph.facebook.com/v19.0/${platformAccountId}/feed`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        attached_media: attachedMedia,
        access_token: accessToken,
      }),
    }
  );
  if (!feedRes.ok) throw new Error(`Facebook feed post failed: ${await feedRes.text()}`);
  const feedData = await feedRes.json();
  return { externalId: feedData.id };
}