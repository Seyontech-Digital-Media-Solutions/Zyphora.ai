import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/oauth/provider";
import { runAutomation } from "@/lib/automations/runautomation";

/**
 * This is the actual Zapier ACTION endpoint — "Run an Automation" in a Zap
 * calls this. Authenticated via the OAuth access token Zapier obtained
 * through /oauth/authorize + /api/oauth/token, not a session cookie.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  const result = await runAutomation(verified.userId, id);

  if (result.notFound) {
    return NextResponse.json({ error: "Automation not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}