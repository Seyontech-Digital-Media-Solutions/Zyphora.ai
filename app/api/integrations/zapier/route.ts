import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getActiveTokenForUser, revokeAllTokensForUser } from "@/lib/oauth/provider";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// GET: connection status for the Zapier card — "Connect" here kicks off the
// standard OAuth consent screen at /oauth/authorize, same shape as your other cards.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeToken = await getActiveTokenForUser(user.id);

  const authUrl =
    `${APP_URL}/oauth/authorize` +
    `?response_type=code` +
    `&client_id=${process.env.ZAPIER_OAUTH_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.ZAPIER_OAUTH_REDIRECT_URI ?? "")}` +
    `&scope=${encodeURIComponent("posts:write posts:read")}` +
    `&state=${user.id}`;

  return NextResponse.json({
    connected: !!activeToken,
    authUrl,
  });
}

// DELETE: "Disconnect" — revokes all active OAuth tokens AND flips connected_accounts
// off, so the Integrations card (which reads connected_accounts) reflects it immediately.
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await revokeAllTokensForUser(user.id);

  const serviceClient = await createServiceClient();
  await serviceClient
    .from("connected_accounts")
    .update({ is_active: false })
    .eq("user_id", user.id)
    .eq("platform", "zapier");

  return NextResponse.json({ success: true });
}