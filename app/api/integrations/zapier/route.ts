import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getActiveTokenForUser, revokeAllTokensForUser } from "@/lib/oauth/provider";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeToken = await getActiveTokenForUser(user.id, "zapier");

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

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await revokeAllTokensForUser(user.id, "zapier");

  const serviceClient = await createServiceClient();
  await serviceClient
    .from("connected_accounts")
    .update({ is_active: false })
    .eq("user_id", user.id)
    .eq("platform", "zapier");

  return NextResponse.json({ success: true });
}