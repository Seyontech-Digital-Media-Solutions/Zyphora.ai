import { createServiceClient } from "@/lib/supabase/server";
import { mockTriggerAutomation } from "@/lib/mock/n8n";

export interface RunAutomationResult {
  success: boolean;
  demo: boolean;
  run: unknown;
  error: string | null;
  response: Record<string, unknown>;
  notFound?: boolean;
}

/**
 * The actual "run an automation" logic, extracted out of
 * app/api/automations/[id]/run/route.ts so both the session-authenticated
 * route (used by your UI) and the token-authenticated /api/v1 route (used
 * by Zapier) call exactly the same code — no duplicated behavior to drift
 * out of sync.
 *
 * Uses the service client since callers have already authenticated the
 * user a different way (session cookie or OAuth token) before calling this.
 */
export async function runAutomation(userId: string, automationId: string): Promise<RunAutomationResult> {
  const supabase = await createServiceClient();

  const { data: automation, error: automationError } = await supabase
    .from("automations")
    .select("*")
    .eq("id", automationId)
    .eq("user_id", userId)
    .single();

  if (automationError || !automation) {
    return {
      success: false,
      demo: false,
      run: null,
      error: "Automation not found",
      response: {},
      notFound: true,
    };
  }

  // Look for a connected webhook target — n8n first, then Zapier (the
  // OUTBOUND trigger direction — separate from the OAuth connection used
  // to authenticate this very call).
  const { data: webhookAccount } = await supabase
    .from("connected_accounts")
    .select("platform, platform_config")
    .eq("user_id", userId)
    .in("platform", ["n8n", "zapier"])
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const webhookUrl = webhookAccount?.platform_config?.webhook_url as string | undefined;

  const startedAt = new Date();
  let status: "success" | "failed" = "success";
  let errorMessage: string | null = null;
  let resultPayload: Record<string, unknown> = {};

  if (webhookUrl) {
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
    resultPayload = await mockTriggerAutomation(automationId, {});
  }

  const completedAt = new Date();
  const durationMs = completedAt.getTime() - startedAt.getTime();

  const { data: run, error: runError } = await supabase
    .from("automation_runs")
    .insert({
      automation_id: automationId,
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

  await supabase
    .from("automations")
    .update({
      run_count: (automation.run_count ?? 0) + 1,
      last_run_at: startedAt.toISOString(),
    })
    .eq("id", automationId);

  return {
    success: status === "success",
    demo: !webhookUrl,
    run,
    error: errorMessage,
    response: resultPayload,
  };
}