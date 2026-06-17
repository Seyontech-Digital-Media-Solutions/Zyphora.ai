import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-05-27.dahlia",
      typescript: true,
    });
  }
  return stripeClient;
}

export const PLANS = {
  free: { name: "Free", credits: 100, price: 0 },
  pro: {
    name: "Pro",
    credits: 2000,
    price: 29,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  agency: {
    name: "Agency",
    credits: -1,
    price: 79,
    priceId: process.env.STRIPE_AGENCY_PRICE_ID,
  },
} as const;

export async function createCheckoutSession({
  customerId,
  priceId,
  userId,
  successUrl,
  cancelUrl,
}: {
  customerId?: string;
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
  });
}

export async function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
