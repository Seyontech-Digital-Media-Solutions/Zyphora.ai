"use client";

import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { PlatformPreview, PLATFORM_LIMITS } from "@/components/content/PlatformPreview";
import { cn } from "@/lib/utils";
import type { Platform } from "@/types";

const PLATFORMS: Platform[] = ["twitter", "linkedin", "instagram"];

interface PostEditorProps {
  activePlatform: Platform;
  onPlatformChange: (p: Platform) => void;
  captions: Record<string, string>;
  onCaptionChange: (platform: string, value: string) => void;
  hashtags: string[];
  selectedHashtags: string[];
  onToggleHashtag: (tag: string) => void;
  onAddHashtag: (tag: string) => void;
  onRegenerateHashtags: () => void;
  media?: File[];
}

export function PostEditor({
  activePlatform,
  onPlatformChange,
  captions,
  onCaptionChange,
  hashtags,
  selectedHashtags,
  onToggleHashtag,
  onAddHashtag,
  onRegenerateHashtags,
  media,
}: PostEditorProps) {
  const caption = captions[activePlatform] ?? "";
  const limit = PLATFORM_LIMITS[activePlatform] ?? 3000;
  const charCount = caption.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((platform) => (
          <button
            key={platform}
            type="button"
            onClick={() => onPlatformChange(platform)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition capitalize",
              activePlatform === platform
                ? "bg-accent/20 text-accent border border-accent/30"
                : "bg-muted/50 text-muted-foreground hover:text-foreground"
            )}
          >
            <PlatformIcon platform={platform} size="sm" />
            {platform}
          </button>
        ))}
      </div>

      <div className="relative">
        <textarea
          value={caption}
          onChange={(e) => onCaptionChange(activePlatform, e.target.value)}
          className="w-full bg-background border border-border rounded-xl p-4 text-foreground resize-none h-40 text-sm focus:ring-1 focus:ring-accent focus:border-accent"
          placeholder="Your caption will appear here after generation..."
        />
        <div
          className={cn(
            "absolute bottom-3 right-3 text-xs",
            charCount > limit ? "text-danger" : "text-muted-foreground"
          )}
        >
          {charCount}/{limit}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-muted-foreground text-sm">Hashtags</label>
          <button
            type="button"
            onClick={onRegenerateHashtags}
            className="text-accent text-xs hover:underline"
          >
            ↻ Regenerate
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag) => (
            <span
              key={tag}
              onClick={() => onToggleHashtag(tag)}
              className={cn(
                "px-2 py-1 rounded-full text-xs cursor-pointer transition",
                selectedHashtags.includes(tag)
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "bg-muted/50 text-muted-foreground border border-border hover:border-accent/30"
              )}
            >
              {tag.startsWith("#") ? tag : `#${tag}`}
            </span>
          ))}
          <input
            placeholder="+ add tag"
            className="px-2 py-1 bg-transparent border border-dashed border-border rounded-full text-xs text-muted-foreground w-20 focus:outline-none focus:border-accent"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val) {
                  onAddHashtag(val.startsWith("#") ? val : `#${val}`);
                  (e.target as HTMLInputElement).value = "";
                }
              }
            }}
          />
        </div>
      </div>

      <div className="p-4 bg-background rounded-xl border border-border">
        <p className="text-muted-foreground text-xs mb-3 uppercase tracking-wider">Preview</p>
        <PlatformPreview
          platform={activePlatform}
          caption={caption}
          hashtags={selectedHashtags}
          media={media}
        />
      </div>
    </div>
  );
}
