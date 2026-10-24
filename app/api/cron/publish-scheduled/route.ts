import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { publishToPlatform } from "@/lib/publishing";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handler(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  const { data: dueItems, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(5);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { id: string; ok: boolean; error?: string }[] = [];

  const fail = async (id: string, message: string) => {
    await supabase
      .from("content_items")
      .update({ status: "failed", error_message: message })
      .eq("id", id);
    console.error(`Scheduled publish failed for ${id}:`, message);
    results.push({ id, ok: false, error: message });
  };

  for (const content of dueItems ?? []) {
    // Claim the post so an overlapping run can't publish it twice
    const { data: claimed } = await supabase
      .from("content_items")
      .update({ status: "publishing" })
      .eq("id", content.id)
      .eq("status", "scheduled")
      .select("id");

    if (!claimed || claimed.length === 0) continue;

    if (!content.platform) {
      await fail(content.id, "No platform set");
      continue;
    }

    const { data: account } = await supabase
      .from("connected_accounts")
      .select("access_token, platform_account_id, token_expires_at")
      .eq("user_id", content.user_id)
      .eq("platform", content.platform)
      .eq("is_active", true)
      .single();

    if (!account) {
      await fail(content.id, `${content.platform} is not connected. Reconnect it on the Integrations page.`);
      continue;
    }

    if (account.token_expires_at && new Date(account.token_expires_at) <= new Date()) {
      await fail(content.id, `${content.platform} token expired. Reconnect it on the Integrations page.`);
      continue;
    }

    try {
      const { externalId } = await publishToPlatform(
        content.platform,
        account,
        content.body,
        content.media_urls ?? []
      );
      await supabase
        .from("content_items")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          post_id_external: externalId,
          error_message: null,
        })
        .eq("id", content.id);
      results.push({ id: content.id, ok: true });
    } catch (publishError) {
      const message = publishError instanceof Error ? publishError.message : "Publish failed";
      await fail(content.id, message);
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

export { handler as GET, handler as POST };