import { redirect } from "next/navigation";
import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { validateClientId, validateRedirectUri } from "@/lib/oauth/provider";

interface PageProps {
  searchParams: Promise<{
    response_type?: string;
    client_id?: string;
    redirect_uri?: string;
    scope?: string;
    state?: string;
  }>;
}

// The consent screen a user sees after clicking "Connect" on Zapier's side.
// Zapier redirects the browser here first: /oauth/authorize?response_type=code&client_id=...&redirect_uri=...&scope=...&state=...
export default async function AuthorizePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { response_type, client_id, redirect_uri, scope, state } = params;

  if (response_type !== "code" || !client_id || !redirect_uri) {
    return ErrorScreen({ message: "Missing or invalid OAuth parameters." });
  }
  if (!validateClientId(client_id)) {
    return ErrorScreen({ message: "Unknown client." });
  }
  if (!validateRedirectUri(redirect_uri)) {
    return ErrorScreen({ message: "Redirect URI is not allow-listed." });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Preserve all the OAuth params through login, then land back here.
    const returnTo = `/oauth/authorize?${new URLSearchParams(params as Record<string, string>).toString()}`;
    redirect(`/login?redirect=${encodeURIComponent(returnTo)}`);
  }

  return createElement(
    "div",
    { style: { maxWidth: 420, margin: "80px auto", fontFamily: "sans-serif", textAlign: "center" } },
    createElement("h1", { style: { fontSize: 20, marginBottom: 8 } }, "Connect Zapier to Zyphora.ai"),
    createElement(
      "p",
      { style: { color: "#666", marginBottom: 24 } },
      "Signed in as ",
      createElement("strong", null, user.email),
      ". Zapier is requesting access to your Zyphora.ai account",
      scope ? ` (${scope})` : "",
      "."
    ),
    createElement(
      "form",
      {
        action: "/api/oauth/authorize/approve",
        method: "POST",
        style: { display: "flex", gap: 12, justifyContent: "center" },
      },
      createElement("input", { type: "hidden", name: "client_id", value: client_id }),
      createElement("input", { type: "hidden", name: "redirect_uri", value: redirect_uri }),
      createElement("input", { type: "hidden", name: "scope", value: scope ?? "" }),
      createElement("input", { type: "hidden", name: "state", value: state ?? "" }),
      createElement(
        "button",
        {
          type: "submit",
          name: "decision",
          value: "deny",
          style: { padding: "10px 20px", borderRadius: 8, border: "1px solid #ccc", background: "white" },
        },
        "Deny"
      ),
      createElement(
        "button",
        {
          type: "submit",
          name: "decision",
          value: "approve",
          style: { padding: "10px 20px", borderRadius: 8, border: "none", background: "#6b4cff", color: "white" },
        },
        "Approve"
      )
    )
  );
}

function ErrorScreen({ message }: { message: string }) {
  return createElement(
    "div",
    { style: { maxWidth: 420, margin: "80px auto", fontFamily: "sans-serif", textAlign: "center", color: "#c00" } },
    createElement("h1", { style: { fontSize: 18 } }, "Connection error"),
    createElement("p", null, message)
  );
}