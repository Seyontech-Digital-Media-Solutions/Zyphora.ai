"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { GrowthGuidance } from "@/components/content/GrowthGuidance";
import {
  MOCK_CONTENT_ITEMS,
  MOCK_POST_ANALYTICS,
  MOCK_COMMENTS,
} from "@/lib/mock/data";
import { ArrowLeft, Eye, Heart, MessageCircle, Repeat2, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import type { Platform } from "@/types";

export default function ContentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const post = useMemo(
    () => MOCK_CONTENT_ITEMS.find((p) => p.id === id),
    [id]
  );

  const analytics = MOCK_POST_ANALYTICS[id];

  if (!post) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Post not found.</p>
        <Link href="/content" className="text-accent text-sm mt-4 inline-block">
          ← Back to Content
        </Link>
      </div>
    );
  }

  const rawAnalytics = post.analytics as {
    likes?: number;
    replies?: number;
    retweets?: number;
    impressions?: number;
  };

  const stats = analytics ?? {
    likes: rawAnalytics.likes ?? 0,
    comments: rawAnalytics.replies ?? 0,
    shares: rawAnalytics.retweets ?? 0,
    reach: rawAnalytics.impressions ?? 0,
    engagementRate: 0,
    impressionsOverTime: [],
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl">
      <Link
        href="/content"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Content
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        {post.platform && (
          <PlatformIcon platform={post.platform as Platform} size="lg" />
        )}
        <Badge variant="outline" className="capitalize text-success border-success/30">
          {post.status}
        </Badge>
        {post.published_at && (
          <span className="text-sm text-muted-foreground">
            Published {format(new Date(post.published_at), "MMM d, yyyy 'at' h:mm a")}
          </span>
        )}
      </div>

      <Card className="p-6 bg-surface border-border">
        <h1 className="text-xl font-bold mb-2">{post.title}</h1>
        <p className="text-foreground whitespace-pre-wrap leading-relaxed">{post.body}</p>
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.hashtags.map((tag) => (
              <span key={tag} className="text-sm text-accent">
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}
      </Card>

      {post.status === "published" && (
        <>
          <Card className="p-6 bg-surface border-border">
            <h2 className="text-lg font-semibold mb-4">Post Performance</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {[
                { icon: Heart, label: "Likes", value: stats.likes },
                { icon: MessageCircle, label: "Comments", value: stats.comments },
                { icon: Repeat2, label: "Shares", value: stats.shares },
                { icon: Eye, label: "Reach", value: stats.reach.toLocaleString() },
                {
                  icon: TrendingUp,
                  label: "Engagement",
                  value: `${stats.engagementRate ?? 0}%`,
                },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="text-center p-3 rounded-lg bg-muted/30">
                  <Icon className="h-5 w-5 text-accent mx-auto mb-1" />
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {stats.impressionsOverTime.length > 0 && (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats.impressionsOverTime}>
                  <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "#111827", border: "1px solid #1F2937" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="impressions"
                    stroke="#6C63FF"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-6 bg-surface border-border">
            <h2 className="text-lg font-semibold mb-4">Comments</h2>
            <div className="space-y-4">
              {MOCK_COMMENTS.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <span className="text-xl">{c.avatar}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-accent">{c.username}</span>
                      <span className="text-xs text-muted-foreground">{c.time}</span>
                    </div>
                    <p className="text-sm text-foreground mt-1">{c.text}</p>
                    <span className="text-xs text-muted-foreground">❤️ {c.likes}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <GrowthGuidance />
        </>
      )}
    </div>
  );
}
