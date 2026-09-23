export async function createAirtableRecord(
  accessToken: string,
  baseId: string,
  tableIdOrName: string,
  fields: Record<string, unknown>
): Promise<{ id: string }> {
  const res = await fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableIdOrName)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    }
  );

  if (!res.ok) {
    throw new Error(`Airtable record creation failed: ${await res.text()}`);
  }
  const data = await res.json();
  return { id: data.id };
}

// Lets the UI show a picker of tables within the connected base.
export async function listAirtableTables(
  accessToken: string,
  baseId: string
): Promise<{ id: string; name: string }[]> {
  const res = await fetch(
    `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    throw new Error(`Airtable table list failed: ${await res.text()}`);
  }
  const data = await res.json();
  return (data.tables ?? []).map((t: { id: string; name: string }) => ({
    id: t.id,
    name: t.name,
  }));
}

// Airtable access tokens expire after ~60 minutes — this exchanges the
// stored refresh token for a fresh access token when needed.
export async function refreshAirtableToken(
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const basicAuth = Buffer.from(
    `${process.env.AIRTABLE_CLIENT_ID}:${process.env.AIRTABLE_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://airtable.com/oauth2/v1/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.AIRTABLE_CLIENT_ID!,
    }),
  });

  if (!res.ok) {
    throw new Error(`Airtable token refresh failed: ${await res.text()}`);
  }
  return res.json();
}