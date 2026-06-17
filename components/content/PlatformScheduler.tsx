"use client";

import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { Switch } from "@/components/ui/switch";
import { MOCK_BEST_TIMES } from "@/lib/mock/data";
import { cn } from "@/lib/utils";
import type { Platform } from "@/types";

const PLATFORMS: Platform[] = ["twitter", "linkedin", "instagram"];

interface PlatformSchedulerProps {
  platformsToPost: Record<string, boolean>;
  postMode: Record<string, "now" | "schedule">;
  scheduledTimes: Record<string, string>;
  isPublishing: boolean;
  onTogglePlatform: (platform: string, enabled: boolean) => void;
  onSetPostMode: (platform: string, mode: "now" | "schedule") => void;
  onSetScheduledTime: (platform: string, time: string) => void;
  onUseAITime: (platform: string) => void;
  onPublish: () => void;
  onSaveDraft: () => void;
}

function getBestTimeLabel(platform: string) {
  const t = MOCK_BEST_TIMES[platform as keyof typeof MOCK_BEST_TIMES];
  if (!t) return "Tuesday 9:00 AM";
  return `${t.day} ${t.time}`;
}

function getAITimeValue(platform: string) {
  const t = MOCK_BEST_TIMES[platform as keyof typeof MOCK_BEST_TIMES];
  if (!t) return "";
  const days: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  const d = new Date();
  const target = days[t.day] ?? 2;
  const diff = (target - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  const [hour, ampm] = t.time.split(" ");
  let h = parseInt(hour);
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  d.setHours(h, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

export function PlatformScheduler({
  platformsToPost,
  postMode,
  scheduledTimes,
  isPublishing,
  onTogglePlatform,
  onSetPostMode,
  onSetScheduledTime,
  onUseAITime,
  onPublish,
  onSaveDraft,
}: PlatformSchedulerProps) {
  const hasAny = Object.values(platformsToPost).some(Boolean);

  const publishLabel = () => {
    const count = Object.values(platformsToPost).filter(Boolean).length;
    const allNow = PLATFORMS.filter((p) => platformsToPost[p]).every(
      (p) => postMode[p] === "now"
    );
    if (count === 0) return "Select a platform";
    if (allNow) return `Publish to ${count} platform${count > 1 ? "s" : ""}`;
    return `Schedule on ${count} platform${count > 1 ? "s" : ""}`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-foreground font-semibold">Schedule & Publish</h3>

      {PLATFORMS.map((platform) => (
        <div key={platform} className="p-4 bg-muted/30 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PlatformIcon platform={platform} size="sm" />
              <span className="text-foreground font-medium text-sm capitalize">
                {platform}
              </span>
              <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
                Connected
              </span>
            </div>
            <Switch
              checked={platformsToPost[platform] ?? false}
              onCheckedChange={(v) => onTogglePlatform(platform, v)}
            />
          </div>

          {platformsToPost[platform] && (
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onSetPostMode(platform, "now")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs border transition",
                    postMode[platform] === "now"
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted-foreground"
                  )}
                >
                  ⚡ Post Now
                </button>
                <button
                  type="button"
                  onClick={() => onSetPostMode(platform, "schedule")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs border transition",
                    postMode[platform] === "schedule"
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted-foreground"
                  )}
                >
                  📅 Schedule
                </button>
              </div>

              {postMode[platform] === "schedule" && (
                <div className="space-y-2">
                  <input
                    type="datetime-local"
                    value={scheduledTimes[platform] ?? ""}
                    onChange={(e) => onSetScheduledTime(platform, e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:ring-1 focus:ring-accent"
                  />
                  <p className="text-xs text-accent flex items-center gap-1 flex-wrap">
                    ✨ Best time: {getBestTimeLabel(platform)}
                    <button
                      type="button"
                      onClick={() => onUseAITime(platform)}
                      className="underline hover:no-underline"
                    >
                      Use this
                    </button>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
        <p className="text-accent text-xs font-medium mb-2">✨ AI Best Times to Post</p>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">𝕏 Twitter: Tue–Thu 9am, 8pm</p>
          <p className="text-muted-foreground text-xs">in LinkedIn: Mon–Wed 8am, 5pm</p>
          <p className="text-muted-foreground text-xs">📷 Instagram: Tue, Fri 11am, 7pm</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onPublish}
        disabled={isPublishing || !hasAny}
        className="w-full py-3 bg-accent hover:bg-accent-light disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-glow"
      >
        {isPublishing ? "⟳ Publishing..." : publishLabel()}
      </button>

      <button
        type="button"
        onClick={onSaveDraft}
        className="w-full py-2 border border-border text-muted-foreground rounded-xl text-sm hover:border-accent/50 hover:text-foreground transition"
      >
        Save as Draft
      </button>
    </div>
  );
}

export { getAITimeValue };
