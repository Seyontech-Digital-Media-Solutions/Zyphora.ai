"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { cn } from "@/lib/utils";
import { Eye, Heart, MessageCircle, Repeat2, Trash2 } from "lucide-react";
import type { ContentItem, ContentStatus, Platform } from "@/types";

const statusStyles: Record<ContentStatus, string> = {
  published: "text-success bg-success/10 border-success/30",
  scheduled: "text-warning bg-warning/10 border-warning/30",
  draft: "text-muted-foreground bg-muted/50 border-border",
  failed: "text-danger bg-danger/10 border-danger/30",
};

function formatReach(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface ContentCardProps {
  item: ContentItem;
  viewMode?: "grid" | "list";
  onDelete?: (id: string) => void;
}

export function ContentCard({ item, viewMode = "grid", onDelete }: ContentCardProps) {
  const analytics = item.analytics as {
    likes?: number;
    replies?: number;
    retweets?: number;
    impressions?: number;
  };
  const hasAnalytics = item.status === "published" && analytics.likes !== undefined;
  const href = item.status === "published" ? `/content/${item.id}` : undefined;

  const card = (
    <Card
      className={cn(
        "bg-surface border-border overflow-hidden transition-colors hover:border-accent/40",
        viewMode === "list" && "flex items-center gap-4 p-4",
        viewMode === "grid" && "p-0"
      )}
    >
      {viewMode === "grid" ? (
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            {item.platform && (
              <PlatformIcon platform={item.platform as Platform} size="sm" />
            )}
            <Badge variant="outline" className={cn("capitalize text-xs", statusStyles[item.status])}>
              {item.status}
            </Badge>
          </div>

          {item.media_urls?.[0] && (
            <div className="aspect-video rounded-lg bg-muted mb-3 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.media_urls[0]} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <p className="text-sm font-medium line-clamp-1">{item.title ?? "Untitled"}</p>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.body}</p>

          {item.hashtags && item.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {item.hashtags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs text-accent">
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            {hasAnalytics ? (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" /> {analytics.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> {analytics.replies ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <Repeat2 className="h-3 w-3" /> {analytics.retweets ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {formatReach(analytics.impressions ?? 0)}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground capitalize">
                {item.scheduled_at ? "Scheduled" : item.status}
              </span>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(item.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-danger" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {item.platform && <PlatformIcon platform={item.platform as Platform} />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.title ?? item.body.slice(0, 40)}</p>
            <p className="text-xs text-muted-foreground truncate">{item.body}</p>
          </div>
          <Badge variant="outline" className={cn("capitalize shrink-0", statusStyles[item.status])}>
            {item.status}
          </Badge>
          {hasAnalytics && (
            <span className="text-xs text-muted-foreground shrink-0">
              ❤️ {analytics.likes}
            </span>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          )}
        </>
      )}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }

  return card;
}
