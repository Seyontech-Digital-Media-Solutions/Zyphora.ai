import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mockTriggerAutomation } from "@/lib/mock/n8n";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: automation, error: automationError } = await supabase
    .from("automations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (automationError || !automation) {
    return NextResponse.json({ error: "Automation not found" }, { status: 404 });
  }

  // Look for a connected webhook target — n8n first, then Zapier.
  const { data: webhookAccount } = await supabase
    .from("connected_accounts")
    .select("platform, platform_config")
    .eq("user_id", user.id)
    .in("platform", ["n8n", "zapier"])
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const webhookUrl = webhookAccount?.platform_config?.webhook_url as
    | string
    | undefined;

  const startedAt = new Date();
  let status: "success" | "failed" = "success";
  let errorMessage: string | null = null;
  let resultPayload: Record<string, unknown> = {};

  if (webhookUrl) {
    // Real path: actually fire the webhook.
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          automation_id: automation.id,
          automation_name: automation.name,
          trigger_type: automation.trigger_type,
          steps: automation.steps,
          triggered_at: startedAt.toISOString(),
        }),
      });

      if (!res.ok) {
        status = "failed";
        errorMessage = `Webhook responded with ${res.status}: ${(await res.text()).slice(0, 300)}`;
      } else {
        resultPayload = await res.json().catch(() => ({}));
      }
    } catch (err) {
      status = "failed";
      errorMessage = err instanceof Error ? err.message : "Webhook request failed";
    }
  } else {
    // No n8n/Zapier connected yet — keep the existing mock behavior so
    // testing the UI doesn't break while you're wiring up a real webhook.
    resultPayload = await mockTriggerAutomation(id, {});
  }

  const completedAt = new Date();
  const durationMs = completedAt.getTime() - startedAt.getTime();

  const { data: run, error: runError } = await supabase
    .from("automation_runs")
    .insert({
      automation_id: id,
      status,
      started_at: startedAt.toISOString(),
      completed_at: completedAt.toISOString(),
      duration_ms: durationMs,
      error_message: errorMessage,
    })
    .select()
    .single();

  if (runError) {
    console.error("Failed to log automation run:", runError);
  }

  // Keep the automation's own run_count/last_run_at in sync for the list view.
  await supabase
    .from("automations")
    .update({
      run_count: (automation.run_count ?? 0) + 1,
      last_run_at: startedAt.toISOString(),
    })
    .eq("id", id);

  return NextResponse.json({
    success: status === "success",
    demo: !webhookUrl,
    run,
    error: errorMessage,
    response: resultPayload,
  });
}