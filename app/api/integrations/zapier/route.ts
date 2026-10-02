import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Same model as n8n: Zapier's "Webhooks by Zapier" trigger step gives the
// user a URL — they paste it here instead of an OAuth login.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { webhookUrl } = await request.json();
  if (!webhookUrl || !webhookUrl.startsWith("https://hooks.zapier.com")) {
    return NextResponse.json(
      { error: "Paste a valid Zapier webhook URL (starts with https://hooks.zapier.com)" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("connected_accounts").upsert(
    {
      user_id: user.id,
      platform: "zapier",
      account_name: "Zapier webhook",
      access_token: null,
      is_active: true,
      platform_config: { webhook_url: webhookUrl },
    },
    { onConflict: "user_id,platform" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
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
    .eq("platform", "zapier");

  return NextResponse.json({ success: true });
}