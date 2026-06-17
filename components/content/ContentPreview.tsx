"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { cn } from "@/lib/utils";
import type { Platform } from "@/types";
import { Heart, MessageCircle, Repeat2, Share, ThumbsUp } from "lucide-react";

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
};

interface ContentPreviewProps {
  platform: Platform | string;
  content: string;
  hashtags?: string[];
  authorName?: string;
  authorHandle?: string;
  avatarUrl?: string;
  className?: string;
}

export function ContentPreview({
  platform,
  content,
  hashtags = [],
  authorName = "Your Brand",
  authorHandle = "@yourbrand",
  avatarUrl,
  className,
}: ContentPreviewProps) {
  const limit = PLATFORM_LIMITS[platform] ?? 3000;
  const fullText = hashtags.length
    ? `${content}\n\n${hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`
    : content;
  const charCount = fullText.length;
  const isOverLimit = charCount > limit;

  if (platform === "twitter") {
    return (
      <div className={cn("rounded-xl border border-border bg-surface p-4", className)}>
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{authorName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-sm">
              <span className="font-semibold">{authorName}</span>
              <span className="text-muted-foreground">{authorHandle}</span>
              <PlatformIcon platform="twitter" size="sm" className="ml-auto" />
            </div>
            <p className="mt-2 text-sm whitespace-pre-wrap break-words">{fullText}</p>
            <div className="mt-3 flex justify-between text-muted-foreground max-w-xs">
              <MessageCircle className="h-4 w-4" />
              <Repeat2 className="h-4 w-4" />
              <Heart className="h-4 w-4" />
              <Share className="h-4 w-4" />
            </div>
          </div>
        </div>
        <CharCount count={charCount} limit={limit} isOver={isOverLimit} />
      </div>
    );
  }

  if (platform === "linkedin") {
    return (
      <div className={cn("rounded-xl border border-border bg-surface p-4", className)}>
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{authorName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{authorName}</p>
            <p className="text-xs text-muted-foreground">Founder at {authorName}</p>
          </div>
          <PlatformIcon platform="linkedin" size="sm" className="ml-auto" />
        </div>
        <p className="mt-4 text-sm whitespace-pre-wrap break-words">{fullText}</p>
        <div className="mt-4 flex gap-6 text-muted-foreground text-xs border-t border-border pt-3">
          <span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" /> Like</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /> Comment</span>
          <span className="flex items-center gap-1"><Share className="h-4 w-4" /> Share</span>
        </div>
        <CharCount count={charCount} limit={limit} isOver={isOverLimit} />
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border bg-surface p-4", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>{authorName[0]}</AvatarFallback>
        </Avatar>
        <span className="font-semibold text-sm">{authorHandle}</span>
        <PlatformIcon platform={platform} size="sm" className="ml-auto" />
      </div>
      <div className="aspect-square rounded-lg bg-muted mb-3 flex items-center justify-center text-muted-foreground text-sm">
        Image preview
      </div>
      <p className="text-sm whitespace-pre-wrap break-words">{fullText}</p>
      <CharCount count={charCount} limit={limit} isOver={isOverLimit} />
    </div>
  );
}

function CharCount({
  count,
  limit,
  isOver,
}: {
  count: number;
  limit: number;
  isOver: boolean;
}) {
  return (
    <p className={cn("mt-3 text-xs text-right", isOver ? "text-danger" : "text-muted-foreground")}>
      {count} / {limit} characters
    </p>
  );
}
