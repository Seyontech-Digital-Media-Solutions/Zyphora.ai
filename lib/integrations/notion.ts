const NOTION_VERSION = "2022-06-28";

export async function createNotionPage(
  accessToken: string,
  databaseId: string,
  title: string,
  content: string
): Promise<{ id: string; url: string }> {
  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        // "Name" is Notion's default title property for a new database —
        // if the target database uses a different title property name,
        // this will need to be adjusted per-database.
        Name: { title: [{ text: { content: title } }] },
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: { rich_text: [{ type: "text", text: { content } }] },
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Notion page creation failed: ${errText}`);
  }
  const data = await res.json();
  return { id: data.id, url: data.url };
}

// Lets the UI show a picker of databases the integration can write to.
export async function listNotionDatabases(
  accessToken: string
): Promise<{ id: string; title: string }[]> {
  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      filter: { property: "object", value: "database" },
    }),
  });

  if (!res.ok) {
    throw new Error(`Notion database list failed: ${await res.text()}`);
  }
  const data = await res.json();
  return (data.results ?? []).map(
    (db: { id: string; title?: { plain_text?: string }[] }) => ({
      id: db.id,
      title: db.title?.[0]?.plain_text ?? "Untitled",
    })
  );
}