"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_INTEGRATIONS } from "@/lib/mock/data";
import { toast } from "@/lib/toast";

const CATEGORY_LABELS: Record<string, string> = {
  social: "Social Platforms",
  productivity: "Productivity",
  communication: "Communication",
  email: "Email",
  crm: "CRM",
  automation: "Automation",
};

export default function IntegrationsPage() {
  const categories = Object.entries(
    MOCK_INTEGRATIONS.reduce<Record<string, typeof MOCK_INTEGRATIONS>>((acc, item) => {
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

      {categories.map(([category, items]) => (
        <div key={category}>
          <h2 className="text-lg font-semibold mb-4">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
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
                {item.connected ? (
                  <p className="text-xs text-muted-foreground mb-3">@user_{item.id}</p>
                ) : null}
                <Button
                  variant={item.connected ? "outline" : "default"}
                  className={!item.connected ? "w-full bg-accent" : "w-full"}
                  onClick={() =>
                    item.connected
                      ? toast("Disconnect coming soon")
                      : toast("OAuth connection coming soon! This will be available in the next update.")
                  }
                >
                  {item.connected ? "Disconnect" : "Connect"}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
