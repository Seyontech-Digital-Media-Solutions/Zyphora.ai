"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { MediaUploader } from "@/components/content/MediaUploader";
import { PostEditor } from "@/components/content/PostEditor";
import {
  PlatformScheduler,
  getAITimeValue,
} from "@/components/content/PlatformScheduler";
import { MOCK_HASHTAGS } from "@/lib/mock/ai";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import type { Platform } from "@/types";

const DEFAULT_CAPTIONS: Record<string, string> = {
  twitter: "",
  linkedin: "",
  instagram: "",
};

export default function CreateContentPage() {
  const router = useRouter();
  const [activePlatform, setActivePlatform] = useState<Platform>("twitter");
  const [captions, setCaptions] = useState(DEFAULT_CAPTIONS);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [platformsToPost, setPlatformsToPost] = useState<Record<string, boolean>>({
    twitter: true,
    linkedin: false,
    instagram: false,
  });
  const [postMode, setPostMode] = useState<Record<string, "now" | "schedule">>({
    twitter: "now",
    linkedin: "now",
    instagram: "now",
  });
  const [scheduledTimes, setScheduledTimes] = useState<Record<string, string>>({});
  const [isPublishing, setIsPublishing] = useState(false);

  const handleGenerated = (result: {
    captions: Record<string, string>;
    hashtags: string[];
    imageDescription?: string;
    isDemo?: boolean;
  }) => {
    setCaptions((prev) => ({ ...prev, ...result.captions }));
    setHashtags(result.hashtags);
    setSelectedHashtags(result.hashtags.slice(0, 5));
    if (!result.isDemo) {
      toast("Caption & hashtags generated!", "success");
    }
  };

  const saveToSupabase = async (status: "draft" | "scheduled" | "published", platform: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast("Please log in first", "error");
      return false;
    }

    const body = captions[platform] || captions.twitter;
    const isScheduled = postMode[platform] === "schedule" && status !== "draft";

    const { error } = await supabase.from("content_items").insert({
      user_id: user.id,
      title: body.slice(0, 50),
      body,
      platform,
      status: isScheduled ? "scheduled" : status,
      scheduled_at:
        isScheduled && scheduledTimes[platform]
          ? new Date(scheduledTimes[platform]).toISOString()
          : null,
      published_at: status === "published" ? new Date().toISOString() : null,
      hashtags: selectedHashtags,
      ai_generated: true,
    });

    if (error) {
      toast("Failed to save — using mock mode", "error");
      return true;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    const platform = activePlatform;
    if (!captions[platform]?.trim()) {
      toast("Add a caption first", "error");
      return;
    }
    await saveToSupabase("draft", platform);
    toast("Saved as draft!", "success");
    router.push("/content?tab=drafts");
  };

  const handlePublish = async () => {
    const selected = Object.entries(platformsToPost)
      .filter(([, v]) => v)
      .map(([p]) => p);

    if (selected.length === 0) {
      toast("Select at least one platform", "error");
      return;
    }

    setIsPublishing(true);
    try {
      for (const platform of selected) {
        const caption = captions[platform]?.trim();
        if (!caption) {
          toast(`Add a caption for ${platform}`, "error");
          continue;
        }
        const status =
          postMode[platform] === "schedule" ? "scheduled" : "published";
        await saveToSupabase(status, platform);
      }
      const allScheduled = selected.every((p) => postMode[p] === "schedule");
      toast(
        allScheduled ? "Posts scheduled successfully!" : "Posts published!",
        "success"
      );
      router.push("/content");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="p-6 md:p-8 pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create & Schedule Post</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload media, generate captions with AI, and schedule across platforms.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="p-5 bg-surface border-border">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Upload & AI
          </h2>
          <MediaUploader
            platformsToPost={platformsToPost}
            onGenerated={handleGenerated}
            onFilesChange={setMediaFiles}
          />
        </Card>

        <Card className="p-5 bg-surface border-border">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Post Editor
          </h2>
          <PostEditor
            activePlatform={activePlatform}
            onPlatformChange={setActivePlatform}
            captions={captions}
            onCaptionChange={(p, v) =>
              setCaptions((prev) => ({ ...prev, [p]: v }))
            }
            hashtags={hashtags}
            selectedHashtags={selectedHashtags}
            onToggleHashtag={(tag) =>
              setSelectedHashtags((prev) =>
                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
              )
            }
            onAddHashtag={(tag) => {
              if (!hashtags.includes(tag)) setHashtags((prev) => [...prev, tag]);
              setSelectedHashtags((prev) => [...prev, tag]);
            }}
            onRegenerateHashtags={() => {
              setHashtags(MOCK_HASHTAGS);
              setSelectedHashtags(MOCK_HASHTAGS.slice(0, 5));
              toast("Hashtags regenerated", "success");
            }}
            media={mediaFiles}
          />
        </Card>

        <Card className="p-5 bg-surface border-border">
          <PlatformScheduler
            platformsToPost={platformsToPost}
            postMode={postMode}
            scheduledTimes={scheduledTimes}
            isPublishing={isPublishing}
            onTogglePlatform={(p, v) =>
              setPlatformsToPost((prev) => ({ ...prev, [p]: v }))
            }
            onSetPostMode={(p, m) =>
              setPostMode((prev) => ({ ...prev, [p]: m }))
            }
            onSetScheduledTime={(p, t) =>
              setScheduledTimes((prev) => ({ ...prev, [p]: t }))
            }
            onUseAITime={(p) => {
              setScheduledTimes((prev) => ({
                ...prev,
                [p]: getAITimeValue(p),
              }));
              toast(`Applied best time for ${p}`, "success");
            }}
            onPublish={handlePublish}
            onSaveDraft={handleSaveDraft}
          />
        </Card>
      </div>
    </div>
  );
}
