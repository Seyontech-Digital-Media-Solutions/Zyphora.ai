import { createClient } from "@/lib/supabase/server";
import { MOCK_INTEGRATIONS } from "@/lib/mock/data";
import { IntegrationsClient } from "@/components/integrations/integrationClient";

// Platforms with a real OAuth flow wired up (app/api/integrations/<id>).
// Everything else in MOCK_INTEGRATIONS stays a "coming soon" placeholder.
const LIVE_PLATFORMS = ["twitter", "linkedin", "instagram", "facebook"];

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const connectedByPlatform = new Map<
    string,
    { account_name: string | null; is_active: boolean }
  >();

  if (user) {
    const { data: rows } = await supabase
      .from("connected_accounts")
      .select("platform, account_name, is_active")
      .eq("user_id", user.id);

    rows?.forEach((row) => {
      connectedByPlatform.set(row.platform, {
        account_name: row.account_name,
        is_active: row.is_active,
      });
    });
  }

  const items = MOCK_INTEGRATIONS.map((item) => {
    if (LIVE_PLATFORMS.includes(item.id)) {
      const row = connectedByPlatform.get(item.id);
      const connected = !!row?.is_active;
      return {
        ...item,
        connected,
        accountName: connected ? row?.account_name ?? null : null,
        live: true as const,
      };
    }
    // Non-wired platforms keep their mock connected/placeholder state.
    return {
      ...item,
      accountName: item.connected ? `@user_${item.id}` : null,
      live: false as const,
    };
  });

  return <IntegrationsClient items={items} />;
}