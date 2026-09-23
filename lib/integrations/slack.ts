export async function postToSlack(
  botToken: string,
  channel: string,
  text: string
): Promise<{ ts: string }> {
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel, text }),
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Slack post failed: ${data.error}`);
  }
  return { ts: data.ts };
}

// Slack channel IDs aren't human-readable, so this helper lets the UI show
// a picker of channels the bot can post to.
export async function listSlackChannels(
  botToken: string
): Promise<{ id: string; name: string }[]> {
  const res = await fetch(
    "https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200",
    { headers: { Authorization: `Bearer ${botToken}` } }
  );
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Slack channel list failed: ${data.error}`);
  }
  return (data.channels ?? []).map((c: { id: string; name: string }) => ({
    id: c.id,
    name: c.name,
  }));
}