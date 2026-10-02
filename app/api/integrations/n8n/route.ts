import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// n8n isn't an OAuth platform — there's no "n8n account" to log into from
// here. The user connects by pasting a webhook URL from their own n8n
// workflow's Webhook trigger node.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { webhookUrl } = await request.json();
  if (!webhookUrl || !webhookUrl.startsWith("http")) {
    return NextResponse.json(
      { error: "A valid webhook URL is required" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("connected_accounts").upsert(
    {
      user_id: user.id,
      platform: "n8n",
      account_name: new URL(webhookUrl).hostname,
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
    .eq("platform", "n8n");

  return NextResponse.json({ success: true });
}