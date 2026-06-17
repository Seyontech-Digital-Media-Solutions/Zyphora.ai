"use client";

import type { Platform } from "@/types";

interface PlatformPreviewProps {
  platform: Platform | string;
  caption: string;
  hashtags?: string[];
  media?: File[];
}

export function PlatformPreview({
  platform,
  caption,
  hashtags = [],
  media,
}: PlatformPreviewProps) {
  const mediaUrl = media?.[0] ? URL.createObjectURL(media[0]) : null;
  const tagLine = hashtags
    .filter((h) => !caption.includes(h))
    .map((h) => (h.startsWith("#") ? h : `#${h}`))
    .join(" ");

  if (platform === "twitter") {
    return (
      <div className="rounded-xl border border-border p-4 bg-black max-w-sm">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-foreground font-bold text-sm">Your Name</span>
              <span className="text-muted-foreground text-sm">@yourhandle</span>
            </div>
            <p className="text-foreground text-sm mt-1 leading-relaxed whitespace-pre-wrap">
              {caption}
              {tagLine && `\n\n${tagLine}`}
            </p>
            {mediaUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl}
                alt=""
                className="mt-3 rounded-xl w-full aspect-video object-cover"
              />
            )}
            <div className="flex gap-6 mt-3 text-muted-foreground text-xs">
              <span>💬 Reply</span>
              <span>🔁 Repost</span>
              <span>❤️ Like</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (platform === "linkedin") {
    return (
      <div className="rounded-xl border border-border p-4 bg-[#1B1F23] max-w-sm">
        <div className="flex gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-blue-600 shrink-0 flex items-center justify-center text-white font-bold">
            Z
          </div>
          <div>
            <p className="text-foreground font-semibold text-sm">Your Name</p>
            <p className="text-muted-foreground text-xs">Founder at Zyphora.ai • 1st</p>
            <p className="text-muted-foreground text-xs">Just now • 🌐</p>
          </div>
        </div>
        {mediaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl} alt="" className="w-full aspect-video object-cover mb-3 rounded" />
        )}
        <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
          {caption}
          {tagLine && `\n\n${tagLine}`}
        </p>
        <div className="flex gap-4 mt-4 pt-3 border-t border-border text-muted-foreground text-xs">
          <span>👍 Like</span>
          <span>💬 Comment</span>
          <span>🔁 Repost</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-black max-w-sm overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
        <span className="text-foreground text-sm font-semibold">yourhandle</span>
        <span className="ml-auto text-muted-foreground text-lg">•••</span>
      </div>
      {mediaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl} alt="" className="w-full aspect-square object-cover" />
      ) : (
        <div className="w-full aspect-square bg-muted flex items-center justify-center text-muted-foreground text-sm">
          No media
        </div>
      )}
      <div className="p-3">
        <div className="flex gap-4 mb-2 text-xl">
          <span>🤍</span>
          <span>💬</span>
          <span>↗️</span>
          <span className="ml-auto">🔖</span>
        </div>
        <p className="text-foreground text-xs leading-relaxed">
          <span className="font-bold">yourhandle</span> {caption}
          {tagLine && ` ${tagLine}`}
        </p>
      </div>
    </div>
  );
}

export const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
  facebook: 63206,
};
