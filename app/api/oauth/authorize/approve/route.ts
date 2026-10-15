import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { issueAuthorizationCode, validateClientId, validateRedirectUri } from "@/lib/oauth/provider";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// Handles the Approve/Deny buttons submitted from /oauth/authorize's consent page.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const clientId = form.get("client_id") as string;
  const redirectUri = form.get("redirect_uri") as string;
  const scope = (form.get("scope") as string) || undefined;
  const state = (form.get("state") as string) || undefined;
  const decision = form.get("decision") as string;

  if (!validateClientId(clientId) || !validateRedirectUri(redirectUri)) {
    return NextResponse.redirect(`${APP_URL}/oauth/authorize?error=invalid_client`);
  }

  const redirectWithParams = (params: Record<string, string>) => {
    const url = new URL(redirectUri);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    return NextResponse.redirect(url.toString());
  };

  if (decision !== "approve") {
    return redirectWithParams({ error: "access_denied", ...(state ? { state } : {}) });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${APP_URL}/login`);
  }

  const code = await issueAuthorizationCode({ userId: user.id, redirectUri, scope });

  return redirectWithParams({ code, ...(state ? { state } : {}) });
}