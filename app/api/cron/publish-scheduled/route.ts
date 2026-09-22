import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { publishToPlatform } from "@/lib/publishing";

// Called on a schedule (e.g. every 5 minutes) by Vercel Cron, Supabase
// pg_cron, or any external scheduler. Protected by CRON_SECRET so it can't
// be triggered by anyone who finds the URL.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  const { data: dueItems, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const content of dueItems ?? []) {
    if (!content.platform) {
      await supabase
        .from("content_items")
        .update({ status: "failed" })
        .eq("id", content.id);
      results.push({ id: content.id, ok: false, error: "No platform set" });
      continue;
    }

    const { data: account } = await supabase
      .from("connected_accounts")
      .select("access_token, platform_account_id")
      .eq("user_id", content.user_id)
      .eq("platform", content.platform)
      .eq("is_active", true)
      .single();

    if (!account) {
      await supabase
        .from("content_items")
        .update({ status: "failed" })
        .eq("id", content.id);
      results.push({ id: content.id, ok: false, error: `${content.platform} not connected` });
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
        })
        .eq("id", content.id);
      results.push({ id: content.id, ok: true });
    } catch (publishError) {
      const message = publishError instanceof Error ? publishError.message : "Publish failed";
      await supabase.from("content_items").update({ status: "failed" }).eq("id", content.id);
      console.error(`Scheduled publish failed for ${content.id}:`, message);
      results.push({ id: content.id, ok: false, error: message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}