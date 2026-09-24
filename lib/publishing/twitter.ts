type PublishInput = {
  accessToken: string;
  platformAccountId: string | null;
  text: string;
  mediaUrls: string[];
};

type PublishResult = { externalId: string };

async function fetchMediaBytes(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch media from ${url}`);
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}

async function uploadImageSimple(accessToken: string, buffer: Buffer): Promise<string> {
  const form = new URLSearchParams();
  form.set("media_data", buffer.toString("base64"));

  const res = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  if (!res.ok) throw new Error(`Twitter image upload failed: ${await res.text()}`);
  const data = await res.json();
  return data.media_id_string;
}

async function uploadVideoChunked(
  accessToken: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const mediaCategory = contentType.includes("gif") ? "tweet_gif" : "tweet_video";

  // INIT
  const initForm = new URLSearchParams({
    command: "INIT",
    total_bytes: String(buffer.length),
    media_type: contentType,
    media_category: mediaCategory,
  });
  const initRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: initForm,
  });
  if (!initRes.ok) throw new Error(`Twitter video INIT failed: ${await initRes.text()}`);
  const { media_id_string: mediaId } = await initRes.json();

  // APPEND (5MB chunks)
  const chunkSize = 5 * 1024 * 1024;
  for (let i = 0, segment = 0; i < buffer.length; i += chunkSize, segment++) {
    const chunk = buffer.subarray(i, i + chunkSize);
    const appendForm = new FormData();
    appendForm.set("command", "APPEND");
    appendForm.set("media_id", mediaId);
    appendForm.set("segment_index", String(segment));
    appendForm.set("media", new Blob([new Uint8Array(chunk)]));

    const appendRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: appendForm,
    });
    if (!appendRes.ok) throw new Error(`Twitter video APPEND failed: ${await appendRes.text()}`);
  }

  // FINALIZE
  const finalizeForm = new URLSearchParams({ command: "FINALIZE", media_id: mediaId });
  const finalizeRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: finalizeForm,
  });
  if (!finalizeRes.ok) throw new Error(`Twitter video FINALIZE failed: ${await finalizeRes.text()}`);
  const finalizeData = await finalizeRes.json();

  // Poll processing status if Twitter says it needs more time.
  let processingInfo = finalizeData.processing_info;
  while (processingInfo && ["pending", "in_progress"].includes(processingInfo.state)) {
    await new Promise((r) => setTimeout(r, (processingInfo.check_after_secs ?? 3) * 1000));
    const statusRes = await fetch(
      `https://upload.twitter.com/1.1/media/upload.json?command=STATUS&media_id=${mediaId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const statusData = await statusRes.json();
    processingInfo = statusData.processing_info;
    if (processingInfo?.state === "failed") {
      throw new Error(`Twitter video processing failed: ${JSON.stringify(processingInfo.error)}`);
    }
  }

  return mediaId;
}

export async function publishToTwitter({
  accessToken,
  text,
  mediaUrls,
}: PublishInput): Promise<PublishResult> {
  const mediaIds: string[] = [];

  for (const url of mediaUrls) {
    const { buffer, contentType } = await fetchMediaBytes(url);
    const isVideo = contentType.startsWith("video/") || contentType.includes("gif");
    const mediaId = isVideo
      ? await uploadVideoChunked(accessToken, buffer, contentType)
      : await uploadImageSimple(accessToken, buffer);
    mediaIds.push(mediaId);
  }

  const body: Record<string, unknown> = { text };
  if (mediaIds.length > 0) {
    body.media = { media_ids: mediaIds };
  }

  const tweetRes = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!tweetRes.ok) {
    throw new Error(`Tweet creation failed: ${await tweetRes.text()}`);
  }

  const tweetData = await tweetRes.json();
  return { externalId: tweetData.data.id };
}
