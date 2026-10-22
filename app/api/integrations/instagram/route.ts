import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Instagram API with Instagram Login: the user signs in on instagram.com.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/instagram/callback`,
    response_type: "code",
    scope: "instagram_business_basic,instagram_business_content_publish",
    state: user.id,
  });

  const authUrl = `https://www.instagram.com/oauth/authorize?${params.toString()}`;

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
    .eq("platform", "instagram");

  return NextResponse.json({ success: true });
}