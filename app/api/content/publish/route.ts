import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Platform API integration would go here
    const { data, error } = await supabase
      .from("content_items")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        post_id_external: `ext_${Date.now()}`,
      })
      .eq("id", contentId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json({ error: "Failed to publish" }, { status: 500 });
  }
}
