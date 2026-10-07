import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope = [
    "public_profile",
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
  ].join(",");

  // redirect_uri (and scope, for safety) MUST be percent-encoded — Facebook
  // parses this as a query string, and an unencoded "https://domain/path"
  // dropped straight into the query value is not guaranteed to round-trip
  // back to the exact string registered in the app's Valid OAuth Redirect
  // URIs, which is a common cause of redirect_uri / domain mismatch errors.
  const redirectUri = `${APP_URL}/api/integrations/facebook/callback`;

  const authUrl =
    `https://www.facebook.com/v19.0/dialog/oauth` +
    `?client_id=${process.env.FACEBOOK_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&response_type=code` +
    `&state=${user.id}`;

  return NextResponse.json({ authUrl });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await supabase
    .from("connected_accounts")
    .update({ is_active: false })
    .eq("user_id", user.id)
    .eq("platform", "facebook");

  return NextResponse.json({ success: true });
}