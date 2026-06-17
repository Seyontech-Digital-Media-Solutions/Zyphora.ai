// Mock Stripe — UI only, no real payments

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    credits: 100,
    features: [
      "100 AI credits/month",
      "3 connected accounts",
      "Basic automations (3 max)",
      "Content calendar",
      "Community support",
    ],
  },
  pro: {
    name: "Pro",
    price: 29,
    credits: 2000,
    features: [
      "2,000 AI credits/month",
      "10 connected accounts",
      "Unlimited automations",
      "Advanced analytics",
      "Priority support",
      "Team members (3)",
    ],
  },
  agency: {
    name: "Agency",
    price: 79,
    credits: 999999,
    features: [
      "Unlimited AI credits",
      "Unlimited connected accounts",
      "White-label option",
      "Client workspaces",
      "Dedicated support",
      "Custom integrations",
    ],
  },
};

export async function mockCreateCheckoutSession(
  planId: string
): Promise<{ url: string }> {
  void planId;
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { url: "#payment-coming-soon" };
}

export function mockGetUserPlan() {
  return {
    plan: "free",
    creditsRemaining: 87,
    creditsTotal: 100,
    renewsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  };
}
