import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
  ].join(" ");

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/youtube/callback`;

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&access_type=offline` + // required to get a refresh_token back
    `&prompt=consent` + // forces Google to re-send refresh_token even on reconnect
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
    .eq("platform", "youtube");

  return NextResponse.json({ success: true });
}