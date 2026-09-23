export async function upsertHubspotContact(
  accessToken: string,
  email: string,
  properties: Record<string, string>
): Promise<{ id: string }> {
  // HubSpot's "create" endpoint fails if the contact already exists — try
  // create first, then fall back to searching + updating by email.
  const createRes = await fetch(
    "https://api.hubapi.com/crm/v3/objects/contacts",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties: { email, ...properties } }),
    }
  );

  if (createRes.ok) {
    const data = await createRes.json();
    return { id: data.id };
  }

  const createError = await createRes.json();
  const alreadyExists =
    createRes.status === 409 ||
    createError?.category === "CONFLICT";

  if (!alreadyExists) {
    throw new Error(`HubSpot contact creation failed: ${JSON.stringify(createError)}`);
  }

  // Find the existing contact by email, then update it.
  const searchRes = await fetch(
    "https://api.hubapi.com/crm/v3/objects/contacts/search",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filterGroups: [
          { filters: [{ propertyName: "email", operator: "EQ", value: email }] },
        ],
        limit: 1,
      }),
    }
  );
  if (!searchRes.ok) {
    throw new Error(`HubSpot contact search failed: ${await searchRes.text()}`);
  }
  const searchData = await searchRes.json();
  const existingId = searchData?.results?.[0]?.id;
  if (!existingId) {
    throw new Error("HubSpot: contact reported as existing but not found by search");
  }

  const updateRes = await fetch(
    `https://api.hubapi.com/crm/v3/objects/contacts/${existingId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties }),
    }
  );
  if (!updateRes.ok) {
    throw new Error(`HubSpot contact update failed: ${await updateRes.text()}`);
  }
  return { id: existingId };
}

// HubSpot access tokens expire after ~30 minutes.
export async function refreshHubspotToken(
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.HUBSPOT_CLIENT_ID!,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
    }),
  });
  if (!res.ok) {
    throw new Error(`HubSpot token refresh failed: ${await res.text()}`);
  }
  return res.json();
}