type PublishInput = {
  accessToken: string; // Page access token linked to the IG Business Account
  platformAccountId: string | null; // IG Business Account ID
  text: string;
  mediaUrls: string[];
};

type PublishResult = { externalId: string };

async function waitUntilReady(containerId: string, accessToken: string) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const data = await res.json();
    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR") {
      throw new Error("Instagram media processing failed");
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("Instagram media processing timed out");
}

export async function publishToInstagram({
  accessToken,
  platformAccountId,
  text,
  mediaUrls,
}: PublishInput): Promise<PublishResult> {
  if (!platformAccountId) {
    throw new Error(
      "No Instagram Business Account linked — connect a Page with a linked Instagram account."
    );
  }
  if (mediaUrls.length === 0) {
    throw new Error("Instagram posts require at least one image or video — text-only isn't supported.");
  }

  // Single media item: straightforward container -> publish.
  if (mediaUrls.length === 1) {
    const headRes = await fetch(mediaUrls[0], { method: "HEAD" });
    const isVideo = (headRes.headers.get("content-type") ?? "").startsWith("video/");

    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${platformAccountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [isVideo ? "video_url" : "image_url"]: mediaUrls[0],
          media_type: isVideo ? "REELS" : undefined,
          caption: text,
          access_token: accessToken,
        }),
      }
    );
    if (!containerRes.ok) {
      throw new Error(`Instagram container creation failed: ${await containerRes.text()}`);
    }
    const containerData = await containerRes.json();
    await waitUntilReady(containerData.id, accessToken);

    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${platformAccountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creation_id: containerData.id, access_token: accessToken }),
      }
    );
    if (!publishRes.ok) {
      throw new Error(`Instagram publish failed: ${await publishRes.text()}`);
    }
    const publishData = await publishRes.json();
    return { externalId: publishData.id };
  }

  // Multiple media items: build a carousel.
  const childIds: string[] = [];
  for (const url of mediaUrls) {
    const headRes = await fetch(url, { method: "HEAD" });
    const isVideo = (headRes.headers.get("content-type") ?? "").startsWith("video/");
    const childRes = await fetch(
      `https://graph.facebook.com/v19.0/${platformAccountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [isVideo ? "video_url" : "image_url"]: url,
          is_carousel_item: true,
          access_token: accessToken,
        }),
      }
    );
    if (!childRes.ok) {
      throw new Error(`Instagram carousel item creation failed: ${await childRes.text()}`);
    }
    const childData = await childRes.json();
    await waitUntilReady(childData.id, accessToken);
    childIds.push(childData.id);
  }

  const carouselRes = await fetch(
    `https://graph.facebook.com/v19.0/${platformAccountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "CAROUSEL",
        children: childIds,
        caption: text,
        access_token: accessToken,
      }),
    }
  );
  if (!carouselRes.ok) {
    throw new Error(`Instagram carousel creation failed: ${await carouselRes.text()}`);
  }
  const carouselData = await carouselRes.json();
  await waitUntilReady(carouselData.id, accessToken);

  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${platformAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: carouselData.id, access_token: accessToken }),
    }
  );
  if (!publishRes.ok) {
    throw new Error(`Instagram carousel publish failed: ${await publishRes.text()}`);
  }
  const publishData = await publishRes.json();
  return { externalId: publishData.id };
}