"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WorkflowBuilder } from "@/components/automations/WorkflowBuilder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { AutomationStep } from "@/types";

export default function NewAutomationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("manual");
  const [steps, setSteps] = useState<AutomationStep[]>([]);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("automations")
      .insert({
        user_id: user.id,
        name,
        description,
        trigger_type: triggerType,
        steps,
      })
      .select()
      .single();

    setSaving(false);
    if (data) router.push(`/automations/${data.id}`);
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Create Automation</h1>

      <Card className="p-6 bg-surface border-border space-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My automation" />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this automation do?"
          />
        </div>
      </Card>

      <WorkflowBuilder
        triggerType={triggerType}
        onTriggerChange={setTriggerType}
        steps={steps}
        onStepsChange={setSteps}
      />

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button className="bg-accent" onClick={save} disabled={saving || !name}>
          {saving ? "Saving..." : "Create Automation"}
        </Button>
      </div>
    </div>
  );
}
