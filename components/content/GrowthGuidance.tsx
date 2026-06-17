"use client";

import { MOCK_GROWTH_TIPS } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

export function GrowthGuidance() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">✨</span>
        <h3 className="text-foreground font-semibold">AI Growth Tips</h3>
        <span className="ml-auto text-xs text-accent bg-accent/10 px-2 py-1 rounded-full">
          Personalized
        </span>
      </div>

      <div className="space-y-3">
        {MOCK_GROWTH_TIPS.map((tip, i) => (
          <div
            key={i}
            className={cn(
              "p-3 rounded-lg border-l-2",
              tip.priority === "high" && "bg-accent/5 border-accent",
              tip.priority === "medium" && "bg-warning/5 border-warning",
              tip.priority === "low" && "bg-muted/30 border-border"
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">{tip.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-medium">{tip.title}</p>
                <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                  {tip.description}
                </p>
                <button className="text-accent text-xs mt-2 hover:underline">
                  {tip.action}
                </button>
              </div>
              {tip.priority === "high" && (
                <span className="text-xs text-danger bg-danger/10 px-2 py-0.5 rounded-full shrink-0">
                  Priority
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
