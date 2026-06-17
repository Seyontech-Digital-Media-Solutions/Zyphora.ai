import { createClient } from "@/lib/supabase/server";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";

import {
  MOCK_STATS,
  MOCK_CONTENT_ITEMS,
  MOCK_AUTOMATIONS,
  MOCK_ACTIVITY,
} from "@/lib/mock/data";
import { mockGetUserPlan } from "@/lib/mock/stripe";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const mockPlan = mockGetUserPlan();
  const activeAutomations = MOCK_AUTOMATIONS.filter((a) => a.is_active);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-6 md:p-8">
      <DashboardWidgets
        profile={profile ?? {}}
        stats={MOCK_STATS}
        contentItems={MOCK_CONTENT_ITEMS}
        automations={activeAutomations}
        activity={MOCK_ACTIVITY}
        mockPlan={{
          creditsRemaining: mockPlan.creditsRemaining,
          total: mockPlan.creditsTotal,
          plan: mockPlan.plan,
        }}
        greeting={greeting()}
      />
    </div>
  );
}
