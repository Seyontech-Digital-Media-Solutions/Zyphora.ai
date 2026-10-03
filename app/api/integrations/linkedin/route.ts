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

  // "r_liteprofile" is the old, now-invalid scope for apps using the newer
  // "Sign In with LinkedIn using OpenID Connect" product. Our callback calls
  // /v2/userinfo (the OpenID Connect endpoint), so the scope here must match
  // that product's scopes, plus w_member_social (from the "Share on LinkedIn"
  // product) so we can actually post on the user's behalf.
  const scope = "openid profile email w_member_social";

  const authUrl =
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${process.env.LINKEDIN_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(`${APP_URL}/api/integrations/linkedin/callback`)}` +
    `&scope=${encodeURIComponent(scope)}` +
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
    .eq("platform", "linkedin");

  return NextResponse.json({ success: true });
}