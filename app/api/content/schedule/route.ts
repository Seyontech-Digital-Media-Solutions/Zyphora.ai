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

    const { contentId, scheduledAt, platforms } = await request.json();

    const { data, error } = await supabase
      .from("content_items")
      .update({
        status: "scheduled",
        scheduled_at: scheduledAt,
        platform: platforms?.[0] ?? null,
      })
      .eq("id", contentId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Schedule error:", error);
    return NextResponse.json({ error: "Failed to schedule" }, { status: 500 });
  }
}
