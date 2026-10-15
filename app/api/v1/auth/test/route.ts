import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyAccessToken } from "@/lib/oauth/provider";

/**
 * Zapier calls this to verify the OAuth2 connection works, and your other
 * /api/v1/* endpoints should use verifyAccessToken() the same way to
 * authenticate requests coming from Zapier.
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
  const { data: userData } = await serviceClient.auth.admin.getUserById(verified.userId);

  return NextResponse.json({
    authenticated: true,
    user_id: verified.userId,
    email: userData?.user?.email ?? null,
  });
}