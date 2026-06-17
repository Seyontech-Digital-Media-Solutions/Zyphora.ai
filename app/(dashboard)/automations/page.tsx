"use client";

import Link from "next/link";
import { useAutomations } from "@/hooks/useAutomations";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Play, Plus, Trash2, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MOCK_AUTOMATION_TEMPLATES } from "@/lib/mock/n8n";
import { toast } from "@/lib/toast";

export default function AutomationsPage() {
  const { automations, loading, toggleActive } = useAutomations();

  const runAutomation = async (id: string) => {
    await fetch(`/api/automations/${id}/run`, { method: "POST" });
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Automations</h1>
          <p className="text-muted-foreground">Build AI-powered workflows.</p>
        </div>
        <ButtonLink href="/automations/new" className="bg-accent hover:bg-accent-light">
          <Plus className="h-4 w-4 mr-2" />
          New Automation
        </ButtonLink>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {automations.map((auto) => (
            <Card key={auto.id} className="p-5 bg-surface border-border">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <Link href={`/automations/${auto.id}`} className="font-medium hover:text-accent">
                      {auto.name}
                    </Link>
                    <p className="text-xs text-muted-foreground capitalize">{auto.trigger_type}</p>
                  </div>
                </div>
                <Switch
                  checked={auto.is_active}
                  onCheckedChange={(checked) => toggleActive(auto.id, checked)}
                />
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <Badge variant="outline">{auto.run_count} runs</Badge>
                {auto.last_run_at && (
                  <span>
                    Last run {formatDistanceToNow(new Date(auto.last_run_at), { addSuffix: true })}
                  </span>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => runAutomation(auto.id)}>
                  <Play className="h-3 w-3 mr-1" /> Run Now
                </Button>
                <Button variant="ghost" size="sm">
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-3 w-3 text-danger" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Templates</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_AUTOMATION_TEMPLATES.map((t) => (
            <Card
              key={t.id}
              className="p-4 bg-surface border-border hover:border-accent/50 transition-colors"
            >
              <p className="text-sm font-medium">{t.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
              <Badge variant="outline" className="mt-2 text-xs">
                {t.trigger}
              </Badge>
              <Button
                size="sm"
                className="w-full mt-3 bg-accent"
                onClick={() => toast("Template applied! Edit your automation in the builder.")}
              >
                Use Template
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
