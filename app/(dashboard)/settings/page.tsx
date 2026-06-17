"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CreditMeter } from "@/components/dashboard/CreditMeter";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/types";
import { mockGetUserPlan } from "@/lib/mock/stripe";
import { toast } from "@/lib/toast";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const mockPlan = mockGetUserPlan();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data as Profile);
    };
    load();
  }, []);

  const saveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").update({
      full_name: profile.full_name,
      company_name: profile.company_name,
      brand_voice: profile.brand_voice,
      ai_instructions: profile.ai_instructions,
    }).eq("id", profile.id);
    setSaving(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="ai">AI Settings</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card className="p-6 bg-surface border-border">
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input
                  value={profile?.full_name ?? ""}
                  onChange={(e) => setProfile((p) => p ? { ...p, full_name: e.target.value } : p)}
                />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={profile?.company_name ?? ""}
                  onChange={(e) => setProfile((p) => p ? { ...p, company_name: e.target.value } : p)}
                />
              </div>
              <Button type="submit" className="bg-accent" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <Card className="p-6 bg-surface border-border space-y-4">
            <div className="space-y-2">
              <Label>Default tone</Label>
              <Input
                value={profile?.brand_voice ?? "professional"}
                onChange={(e) => setProfile((p) => p ? { ...p, brand_voice: e.target.value as Profile["brand_voice"] } : p)}
              />
            </div>
            <div className="space-y-2">
              <Label>Custom AI instructions</Label>
              <Textarea
                value={profile?.ai_instructions ?? ""}
                onChange={(e) => setProfile((p) => p ? { ...p, ai_instructions: e.target.value } : p)}
                placeholder="Always mention our core values..."
                rows={4}
              />
            </div>
            <Button className="bg-accent">Save AI Settings</Button>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <Card className="p-6 bg-surface border-border space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current plan</p>
                <p className="text-xl font-bold capitalize">{mockPlan.plan}</p>
              </div>
              <Badge className="bg-accent capitalize">{mockPlan.plan}</Badge>
            </div>
            <CreditMeter
              remaining={mockPlan.creditsRemaining}
              total={mockPlan.creditsTotal}
              plan={mockPlan.plan}
            />
            <div className="flex gap-3">
              <Button
                className="bg-accent"
                onClick={() => toast("Payments coming soon! Explore the app on the free plan.")}
              >
                Upgrade to Pro
              </Button>
              <Button
                variant="outline"
                onClick={() => toast("Payments coming soon!")}
              >
                Manage Billing
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card className="p-6 bg-surface border-border">
            <p className="text-muted-foreground text-sm mb-4">
              Team features available on Pro and Agency plans.
            </p>
            <Button variant="outline" disabled>
              Invite team member
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card className="p-6 bg-surface border-border space-y-4">
            {["Email notifications", "Automation alerts", "Weekly digest"].map((n) => (
              <div key={n} className="flex items-center justify-between">
                <span className="text-sm">{n}</span>
                <Switch defaultChecked />
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <Card className="p-6 bg-surface border-border space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input readOnly value="zyp_live_••••••••••••••••" />
            </div>
            <Button variant="outline">Regenerate key</Button>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="mt-6">
          <Card className="p-6 bg-surface border-danger/30 border space-y-4">
            <p className="text-sm text-danger">
              Permanently delete your account and all associated data.
            </p>
            <Button variant="destructive">Delete account</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
