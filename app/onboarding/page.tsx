"use client";

import { useState } from "react";
import { completeOnboarding } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { CheckCircle2 } from "lucide-react";
import { toast } from "@/lib/toast";

const STEPS = ["Business", "Social", "Brand Voice", "Done"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [brandVoice, setBrandVoice] = useState("professional");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md bg-surface border-border text-center p-8">
          <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
          <CardTitle className="text-2xl">You&apos;re all set! 🚀</CardTitle>
          <CardDescription className="mt-2">
            Your Zyphora workspace is ready. Let&apos;s start creating.
          </CardDescription>
          <div className="mt-4 p-4 rounded-lg border border-border text-left text-sm space-y-1">
            <p><span className="text-muted-foreground">Company:</span> {companyName || "My Business"}</p>
            <p><span className="text-muted-foreground">Industry:</span> {industry || "technology"}</p>
            <p><span className="text-muted-foreground">Brand voice:</span> <span className="capitalize">{brandVoice}</span></p>
          </div>
          <form action={completeOnboarding}>
            <input type="hidden" name="companyName" value={companyName || "My Business"} />
            <input type="hidden" name="industry" value={industry || "technology"} />
            <input type="hidden" name="website" value={website} />
            <input type="hidden" name="brandVoice" value={brandVoice} />
            <Button type="submit" className="mt-6 bg-accent hover:bg-accent-light w-full">
              Go to Dashboard
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg bg-surface border-border">
        <CardHeader>
          <div className="flex gap-2 mb-4">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-muted"}`}
              />
            ))}
          </div>
          <CardTitle>Step {step + 1}: {STEPS[step]}</CardTitle>
          <CardDescription>
            {step === 0 && "Tell us about your business"}
            {step === 1 && "Connect your first social account"}
            {step === 2 && "Set your brand voice"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Business name</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Inc."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="SaaS, E-commerce, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yoursite.com"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-3 gap-4">
              {(["twitter", "linkedin", "instagram"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => toast("OAuth connection coming soon! This will be available in the next update.")}
                  className="p-4 rounded-xl border border-border hover:border-accent/50 text-center transition-colors"
                >
                  <PlatformIcon platform={p} size="lg" className="justify-center" />
                  <p className="text-xs mt-2 capitalize">{p}</p>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { voice: "professional", desc: "Clear, authoritative, business-focused" },
                { voice: "casual", desc: "Friendly, conversational, approachable" },
                { voice: "witty", desc: "Clever, humorous, memorable" },
                { voice: "educational", desc: "Informative, helpful, teaching-focused" },
              ].map(({ voice, desc }) => (
                <button
                  key={voice}
                  type="button"
                  onClick={() => setBrandVoice(voice)}
                  className={`p-4 rounded-xl border text-left capitalize transition-colors ${
                    brandVoice === voice
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  <p className="font-medium">{voice}</p>
                  <p className="text-xs text-muted-foreground mt-1 normal-case">{desc}</p>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Back
            </Button>
            <Button
              className="bg-accent hover:bg-accent-light"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 0 && !companyName.trim()}
            >
              {step === 2 ? "Finish" : "Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
