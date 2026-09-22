type PublishInput = {
  accessToken: string;
  platformAccountId: string | null; // LinkedIn member URN, e.g. "abc123"
  text: string;
  mediaUrls: string[];
};

type PublishResult = { externalId: string };

async function registerAndUploadAsset(
  accessToken: string,
  authorUrn: string,
  mediaUrl: string,
  recipe: "feedshare-image" | "feedshare-video"
): Promise<string> {
  const registerRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: [`urn:li:digitalmediaRecipe:${recipe}`],
        owner: authorUrn,
        serviceRelationships: [
          { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
        ],
      },
    }),
  });
  if (!registerRes.ok) {
    throw new Error(`LinkedIn asset registration failed: ${await registerRes.text()}`);
  }
  const registerData = await registerRes.json();
  const uploadUrl =
    registerData.value.uploadMechanism[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ].uploadUrl;
  const asset = registerData.value.asset;

  const fileRes = await fetch(mediaUrl);
  if (!fileRes.ok) throw new Error(`Failed to fetch media from ${mediaUrl}`);
  const fileBuffer = Buffer.from(await fileRes.arrayBuffer());

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: fileBuffer,
  });
  if (!putRes.ok) throw new Error(`LinkedIn asset upload failed: ${await putRes.text()}`);

  return asset;
}

export async function publishToLinkedIn({
  accessToken,
  platformAccountId,
  text,
  mediaUrls,
}: PublishInput): Promise<PublishResult> {
  if (!platformAccountId) {
    throw new Error("Missing LinkedIn member URN — reconnect the LinkedIn account.");
  }
  const authorUrn = `urn:li:person:${platformAccountId}`;

  const assets: { status: string; media: string }[] = [];
  for (const url of mediaUrls) {
    const contentType = (await fetch(url, { method: "HEAD" })).headers.get("content-type") ?? "";
    const isVideo = contentType.startsWith("video/");
    const asset = await registerAndUploadAsset(
      accessToken,
      authorUrn,
      url,
      isVideo ? "feedshare-video" : "feedshare-image"
    );
    assets.push({ status: "READY", media: asset });
  }

  const shareContent: Record<string, unknown> = {
    shareCommentary: { text },
    shareMediaCategory: assets.length === 0 ? "NONE" : mediaUrls.length && assets.length ? "IMAGE" : "NONE",
  };
  if (assets.length > 0) {
    shareContent.media = assets;
  }

  const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": shareContent,
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });

  if (!postRes.ok) {
    throw new Error(`LinkedIn post creation failed: ${await postRes.text()}`);
  }

  const externalId = postRes.headers.get("x-restli-id") ?? "unknown";
  return { externalId };
}