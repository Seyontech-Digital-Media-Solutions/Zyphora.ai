import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe, PLANS } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { sendBillingEmail, sendWelcomeEmail } from "@/lib/resend";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headerList = await headers();
  const signature = headerList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) break;

      const plan =
        session.amount_total === 7900
          ? "agency"
          : session.amount_total === 2900
          ? "pro"
          : "starter";

      await supabase
        .from("profiles")
        .update({
          plan,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          credits_remaining:
            plan === "agency" ? 999999 : plan === "pro" ? 2000 : 100,
        })
        .eq("id", userId);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      if (session.customer_email) {
        await sendWelcomeEmail({
          to: session.customer_email,
          name: profile?.full_name ?? "there",
        });
        await sendBillingEmail({ to: session.customer_email, plan });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const plan =
        event.type === "customer.subscription.deleted"
          ? "free"
          : subscription.items.data[0]?.price.id === PLANS.agency.priceId
          ? "agency"
          : subscription.items.data[0]?.price.id === PLANS.pro.priceId
          ? "pro"
          : "starter";

      await supabase
        .from("profiles")
        .update({
          plan,
          credits_remaining: plan === "free" ? 100 : plan === "pro" ? 2000 : 999999,
        })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
