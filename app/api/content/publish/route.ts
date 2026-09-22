import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publishToPlatform } from "@/lib/publishing";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contentId } = await request.json();

    const { data: content } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", contentId)
      .eq("user_id", user.id)
      .single();

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }
    if (!content.platform) {
      return NextResponse.json({ error: "Content has no target platform set" }, { status: 400 });
    }

    const { data: account } = await supabase
      .from("connected_accounts")
      .select("access_token, platform_account_id")
      .eq("user_id", user.id)
      .eq("platform", content.platform)
      .eq("is_active", true)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: `${content.platform} isn't connected. Connect it in Integrations first.` },
        { status: 400 }
      );
    }

    try {
      const { externalId } = await publishToPlatform(
        content.platform,
        account,
        content.body,
        content.media_urls ?? []
      );

      const { data, error } = await supabase
        .from("content_items")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          post_id_external: externalId,
        })
        .eq("id", contentId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(data);
    } catch (publishError) {
      const message =
        publishError instanceof Error ? publishError.message : "Publishing failed";
      await supabase
        .from("content_items")
        .update({ status: "failed" })
        .eq("id", contentId);
      console.error("Publish to platform failed:", message);
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json({ error: "Failed to publish" }, { status: 500 });
  }
}