"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { PLANS } from "@/lib/mock/stripe";
import { toast } from "@/lib/toast";

const plans = [
  { key: "free" as const, featured: false },
  { key: "pro" as const, featured: true },
  { key: "agency" as const, featured: false },
];

export function PricingCards() {
  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {plans.map(({ key, featured }) => {
        const plan = PLANS[key];
        return (
          <Card
            key={key}
            className={`p-6 bg-surface border-border ${featured ? "border-accent shadow-glow" : ""}`}
          >
            <h3 className="font-semibold text-lg">{plan.name}</h3>
            <p className="text-3xl font-bold mt-2">
              ${plan.price}
              <span className="text-sm text-muted-foreground font-normal">/mo</span>
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              {plan.features.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            {key === "free" ? (
              <ButtonLink href="/signup" className="w-full mt-6" variant="outline">
                Get Started
              </ButtonLink>
            ) : (
              <Button
                className={`w-full mt-6 ${featured ? "bg-accent hover:bg-accent-light" : ""}`}
                variant={featured ? "default" : "outline"}
                onClick={() => toast("Payments coming soon! Sign up free to explore the app.")}
              >
                Get Started
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  );
}
