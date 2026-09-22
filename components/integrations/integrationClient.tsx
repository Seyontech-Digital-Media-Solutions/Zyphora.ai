"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";

const CATEGORY_LABELS: Record<string, string> = {
  social: "Social Platforms",
  productivity: "Productivity",
  communication: "Communication",
  email: "Email",
  crm: "CRM",
  automation: "Automation",
};

type IntegrationItem = {
  id: string;
  name: string;
  category: string;
  connected: boolean;
  icon: string;
  accountName: string | null;
  live: boolean;
};

const PLATFORM_LABELS: Record<string, string> = {
  twitter: "Twitter/X",
  linkedin: "LinkedIn",
  instagram: "Instagram",
};

export function IntegrationsClient({ items }: { items: IntegrationItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Surface the redirect-back result from an OAuth callback, then clean the URL.
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected) {
      toast(`${PLATFORM_LABELS[connected] ?? connected} connected!`, "success");
      router.replace("/integrations");
    } else if (error) {
      toast(`Connection failed: ${error.replace(/_/g, " ")}`, "error");
      router.replace("/integrations");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleConnect(item: IntegrationItem) {
    if (!item.live) {
      toast("OAuth connection coming soon! This will be available in the next update.");
      return;
    }
    setPendingId(item.id);
    try {
      const res = await fetch(`/api/integrations/${item.id}`);
      const data = await res.json();
      if (!res.ok || !data.authUrl) {
        toast(data.error ?? "Couldn't start connection. Try again.", "error");
        return;
      }
      window.location.href = data.authUrl;
    } catch {
      toast("Couldn't start connection. Try again.", "error");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDisconnect(item: IntegrationItem) {
    if (!item.live) {
      toast("Disconnect coming soon");
      return;
    }
    setPendingId(item.id);
    try {
      const res = await fetch(`/api/integrations/${item.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast(data.error ?? "Couldn't disconnect. Try again.", "error");
        return;
      }
      toast(`${PLATFORM_LABELS[item.id] ?? item.name} disconnected`, "success");
      startTransition(() => router.refresh());
    } catch {
      toast("Couldn't disconnect. Try again.", "error");
    } finally {
      setPendingId(null);
    }
  }

  const categories = Object.entries(
    items.reduce<Record<string, IntegrationItem[]>>((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {})
  );

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">Connect your tools and platforms.</p>
      </div>

      {categories.map(([category, categoryItems]) => (
        <div key={category}>
          <h2 className="text-lg font-semibold mb-4">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryItems.map((item) => (
              <Card key={item.id} className="p-4 bg-surface border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-sm font-bold">
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <Badge variant={item.connected ? "default" : "outline"}>
                    {item.connected ? "Connected" : "Not connected"}
                  </Badge>
                </div>
                {item.connected && item.accountName ? (
                  <p className="text-xs text-muted-foreground mb-3">{item.accountName}</p>
                ) : null}
                <Button
                  variant={item.connected ? "outline" : "default"}
                  className={!item.connected ? "w-full bg-accent" : "w-full"}
                  disabled={pendingId === item.id}
                  onClick={() =>
                    item.connected ? handleDisconnect(item) : handleConnect(item)
                  }
                >
                  {pendingId === item.id
                    ? "Working..."
                    : item.connected
                    ? "Disconnect"
                    : "Connect"}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}