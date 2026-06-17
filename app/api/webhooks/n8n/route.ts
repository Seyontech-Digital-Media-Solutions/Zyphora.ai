import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { automationId, userId, status, output, error } = body;

    if (!automationId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    await supabase.from("automation_runs").insert({
      automation_id: automationId,
      user_id: userId,
      status: status ?? "success",
      output_data: output ?? {},
      error_message: error ?? null,
      completed_at: new Date().toISOString(),
    });

    if (status === "success") {
      const { data: automation } = await supabase
        .from("automations")
        .select("run_count")
        .eq("id", automationId)
        .single();

      if (automation) {
        await supabase
          .from("automations")
          .update({
            run_count: automation.run_count + 1,
            last_run_at: new Date().toISOString(),
          })
          .eq("id", automationId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("n8n webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
