import {
  BarChart3,
  Inbox,
  Layers,
  PenLine,
  Plug,
  Sparkles,
  Zap,
} from "lucide-react";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { PricingCards } from "@/components/landing/PricingCards";

const features = [
  { icon: PenLine, title: "AI Content", desc: "Generate platform-optimized posts in seconds." },
  { icon: Zap, title: "Automations", desc: "Build multi-step AI pipelines with n8n." },
  { icon: BarChart3, title: "Analytics", desc: "Track growth and engagement across platforms." },
  { icon: Inbox, title: "Inbox", desc: "Unified AI assistant for business tasks." },
  { icon: Plug, title: "Integrations", desc: "Connect Twitter, LinkedIn, Instagram & more." },
  { icon: Sparkles, title: "AI Assistant", desc: "Chat with your business context built in." },
];

const faqs = [
  {
    q: "What is Zyphora?",
    a: "Zyphora is an all-in-one AI business assistant that combines content creation, workflow automation, and social media analytics.",
  },
  {
    q: "How do AI credits work?",
    a: "1 credit = 1 content generation or ~500 AI chat tokens. Free plans get 100 credits/month.",
  },
  {
    q: "Can I connect my social accounts?",
    a: "Yes! Connect Twitter, LinkedIn, Instagram, and more via OAuth integrations.",
  },
  {
    q: "Do you support automations?",
    a: "Yes, build visual workflows that connect to n8n for powerful automation.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Layers className="h-8 w-8 text-accent" />
            <span className="text-xl font-bold">Zyphora</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <ButtonLink href="/login" variant="ghost">
              Log in
            </ButtonLink>
            <ButtonLink href="/signup" className="bg-accent hover:bg-accent-light">
              Start Free
            </ButtonLink>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
            Your entire business,{" "}
            <span className="text-accent">run by AI</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Create content, automate workflows, and grow your social presence — all from one powerful dashboard.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <ButtonLink href="/signup" size="lg" className="bg-accent hover:bg-accent-light shadow-glow">
              Start Free
            </ButtonLink>
            <ButtonLink href="#features" size="lg" variant="outline">
              Watch Demo
            </ButtonLink>
          </div>
        </div>

        <div className="mt-16 mx-auto max-w-5xl rounded-2xl border border-border bg-surface p-2 shadow-glow">
          <div className="rounded-xl bg-muted/50 aspect-video flex items-center justify-center">
            <div className="grid grid-cols-3 gap-4 p-8 w-full max-w-2xl">
              {["Content", "Automations", "Analytics"].map((label) => (
                <Card key={label} className="p-4 bg-surface border-border text-left">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold mt-1 text-accent">
                    {label === "Content" ? "24" : label === "Automations" ? "8" : "12.4k"}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need to grow</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="p-6 bg-surface border-border hover:shadow-glow transition-shadow">
              <f.icon className="h-8 w-8 text-accent mb-4" />
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-muted-foreground text-sm mt-2">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-6">Works with your favorite platforms</p>
        <div className="flex flex-wrap justify-center gap-8">
          {(["twitter", "linkedin", "instagram", "facebook", "tiktok", "youtube"] as const).map(
            (p) => (
              <PlatformIcon key={p} platform={p} size="lg" showLabel />
            )
          )}
        </div>
      </section>

      <section id="pricing" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Simple pricing</h2>
        <PricingCards />
      </section>

      <section id="faq" className="container mx-auto px-4 py-20 max-w-2xl">
        <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
        <Accordion>
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{faq.q}</AccordionTrigger>
              <AccordionContent>{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-accent" />
            <span className="font-semibold">Zyphora.ai</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Zyphora. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
