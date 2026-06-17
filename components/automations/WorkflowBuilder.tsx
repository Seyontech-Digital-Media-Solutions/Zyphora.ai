"use client";

import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { GripVertical, Plus, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AutomationStep } from "@/types";

const TRIGGER_TYPES = [
  { value: "schedule", label: "Schedule" },
  { value: "webhook", label: "Webhook" },
  { value: "mention", label: "New Mention / Keyword" },
  { value: "form", label: "Form Submission" },
  { value: "email", label: "Email Received" },
  { value: "manual", label: "Manual Trigger" },
];

const ACTION_TYPES = [
  { value: "generate_content", label: "Generate AI Content" },
  { value: "post_social", label: "Post to Social Media" },
  { value: "send_email", label: "Send Email" },
  { value: "http_request", label: "HTTP Request" },
  { value: "filter", label: "Filter / Condition" },
  { value: "delay", label: "Delay" },
  { value: "format_data", label: "Format Data" },
  { value: "save_db", label: "Save to Database" },
  { value: "slack", label: "Send Slack Notification" },
  { value: "summarize_ai", label: "Summarize with AI" },
];

interface WorkflowBuilderProps {
  triggerType: string;
  onTriggerChange: (type: string) => void;
  steps: AutomationStep[];
  onStepsChange: (steps: AutomationStep[]) => void;
}

export function WorkflowBuilder({
  triggerType,
  onTriggerChange,
  steps,
  onStepsChange,
}: WorkflowBuilderProps) {
  const addStep = (type: string) => {
    const label = ACTION_TYPES.find((a) => a.value === type)?.label ?? type;
    onStepsChange([
      ...steps,
      { id: crypto.randomUUID(), type, label, config: {} },
    ]);
  };

  const removeStep = (id: string) => {
    onStepsChange(steps.filter((s) => s.id !== id));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(steps);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    onStepsChange(reordered);
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-surface border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
            <Zap className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Trigger</p>
            <Select value={triggerType} onValueChange={(v) => v && onTriggerChange(v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="flex justify-center">
        <div className="h-8 w-px bg-border" />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="steps">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
              {steps.map((step, index) => (
                <Draggable key={step.id} draggableId={step.id} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`p-4 bg-surface border-border ${
                        snapshot.isDragging ? "shadow-glow" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div {...provided.dragHandleProps}>
                          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{step.label}</p>
                          <p className="text-xs text-muted-foreground">{step.type}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStep(step.id)}
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      </div>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Select onValueChange={(v) => typeof v === "string" && addStep(v)}>
        <SelectTrigger className="w-full border-dashed">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Plus className="h-4 w-4" />
            <SelectValue placeholder="Add action step" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {ACTION_TYPES.map((a) => (
            <SelectItem key={a.value} value={a.value}>
              {a.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
