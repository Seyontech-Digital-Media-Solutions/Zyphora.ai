"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useContent } from "@/hooks/useContent";
import { ContentCard } from "@/components/content/ContentCard";
import { GrowthGuidance } from "@/components/content/GrowthGuidance";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Calendar, Grid, List, Plus } from "lucide-react";
import type { ContentStatus } from "@/types";

const PLATFORM_CHIPS = [
  { id: "all", label: "All" },
  { id: "twitter", label: "𝕏 Twitter" },
  { id: "linkedin", label: "in LinkedIn" },
  { id: "instagram", label: "📷 Instagram" },
  { id: "facebook", label: "f Facebook" },
];

const TAB_MAP: Record<string, ContentStatus | undefined> = {
  all: undefined,
  drafts: "draft",
  scheduled: "scheduled",
  published: "published",
};

export default function ContentPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "all";
  const normalizedTab = initialTab === "draft" ? "drafts" : initialTab;

  const [filter, setFilter] = useState(normalizedTab);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const status = TAB_MAP[filter];
  const { items, loading, deleteItem } = useContent(status);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const platformMatch =
        platformFilter === "all" || item.platform === platformFilter;
      return platformMatch;
    });
  }, [items, platformFilter]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Content Studio</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create, schedule, and manage your social content.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "text-accent" : "text-muted-foreground"}
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "text-accent" : "text-muted-foreground"}
          >
            <List className="h-5 w-5" />
          </button>
          <ButtonLink href="/content/calendar" variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-1" />
            Calendar
          </ButtonLink>
          <ButtonLink href="/content/create" className="bg-accent hover:bg-accent-light">
            <Plus className="h-4 w-4 mr-2" />
            Create
          </ButtonLink>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex gap-1 bg-surface p-1 rounded-lg w-fit">
          {["all", "drafts", "scheduled", "published"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={cn(
                "px-4 py-2 rounded-md text-sm capitalize transition",
                filter === tab
                  ? "bg-accent text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {PLATFORM_CHIPS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlatformFilter(p.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs border transition",
                platformFilter === p.id
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted-foreground hover:border-accent/30"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-foreground font-semibold text-lg">No content yet</h3>
              <p className="text-muted-foreground text-sm mt-2 mb-6">
                Create your first post with AI
              </p>
              <Link href="/content/create">
                <button
                  type="button"
                  className="px-6 py-3 bg-accent text-white rounded-xl font-medium"
                >
                  ✨ Create with AI
                </button>
              </Link>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "flex flex-col gap-3"
              }
            >
              {filtered.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  viewMode={viewMode}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          )}
        </div>

        <div className="hidden xl:block">
          <GrowthGuidance />
        </div>
      </div>
    </div>
  );
}
