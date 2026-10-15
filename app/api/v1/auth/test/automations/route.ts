import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyAccessToken } from "@/lib/oauth/provider";

/**
 * Lists the user's automations — this is what Zapier calls to populate the
 * dynamic dropdown field in the "Run an Automation" action, so the user
 * building a Zap can pick which automation it should trigger by name
 * instead of typing in a raw id.
 *
 * Authenticated via the OAuth access token from /oauth/authorize, not a
 * session cookie — same as /api/v1/auth/test.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!accessToken) {
    return NextResponse.json({ error: "Missing access token" }, { status: 401 });
  }

  const verified = await verifyAccessToken(accessToken);
  if (!verified) {
    return NextResponse.json({ error: "Invalid or expired access token" }, { status: 401 });
  }

  const serviceClient = await createServiceClient();
  const { data, error } = await serviceClient
    .from("automations")
    .select("id, name, trigger_type, run_count, last_run_at")
    .eq("user_id", verified.userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Zapier's dynamic dropdowns expect an "id" + a human label — "name" works as-is.
  return NextResponse.json(data);
}