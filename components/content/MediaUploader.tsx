"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

const TONES = ["Professional", "Casual", "Witty", "Educational"];

interface MediaUploaderProps {
  platformsToPost?: Record<string, boolean>;
  onGenerated: (result: {
    captions: Record<string, string>;
    hashtags: string[];
    imageDescription?: string;
    isDemo?: boolean;
  }) => void;
  onFilesChange?: (files: File[]) => void;
}

export function MediaUploader({
  platformsToPost = { twitter: true, linkedin: true, instagram: true },
  onGenerated,
  onFilesChange,
}: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [manualPrompt, setManualPrompt] = useState("");
  const [selectedTone, setSelectedTone] = useState("Professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState("");
  const [generationError, setGenerationError] = useState<string | null>(null);

  const updateFiles = (next: File[]) => {
    setUploadedFiles(next);
    onFilesChange?.(next);
    if (next.length === 0) {
      setImageAnalysis("");
      setGenerationError(null);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    updateFiles([...uploadedFiles, ...Array.from(files)].slice(0, 6));
  };

  const removeFile = (index: number) => {
    updateFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleGenerateCaption = async (fromMedia: boolean) => {
    if (fromMedia && uploadedFiles.length === 0) return;
    if (!fromMedia && !manualPrompt.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const formData = new FormData();

      if (fromMedia && uploadedFiles.length > 0) {
        formData.append("image", uploadedFiles[0]);
      }

      formData.append("prompt", manualPrompt);
      formData.append("tone", selectedTone.toLowerCase());
      formData.append(
        "platforms",
        JSON.stringify(
          Object.keys(platformsToPost).filter((p) => platformsToPost[p])
        )
      );

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data._apiError || data.error) {
        const errMsg =
          data.error ||
          "Generation failed — check your GEMINI_API_KEY in .env.local";
        setGenerationError(errMsg);
        toast(errMsg, "error");
        return;
      }

      if (data._demo) {
        setGenerationError(
          "Demo mode — no GEMINI_API_KEY in .env.local. Add your key from aistudio.google.com"
        );
        toast("Demo mode — add GEMINI_API_KEY to .env.local", "error");
      }

      if (data.imageDescription) {
        setImageAnalysis(data.imageDescription);
      }

      onGenerated({
        captions: {
          twitter: data.platformVersions?.twitter || data.caption || "",
          linkedin: data.platformVersions?.linkedin || data.caption || "",
          instagram: data.platformVersions?.instagram || data.caption || "",
        },
        hashtags: (data.hashtags ?? []).map((h: string) =>
          h.startsWith("#") ? h : `#${h}`
        ),
        imageDescription: data.imageDescription,
        isDemo: data._demo,
      });

      if (!data._demo) {
        toast(
          data.imageDescription
            ? `Captions generated! AI detected: ${data.imageDescription.slice(0, 60)}...`
            : "Captions generated for all platforms!",
          "success"
        );
      }
    } catch (err) {
      console.error(err);
      setGenerationError("Failed to generate. Please try again.");
      toast("Generation failed — please try again", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-accent/40 rounded-xl p-8 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="text-4xl mb-3">📸</div>
        <p className="text-foreground font-medium">Drop your media here</p>
        <p className="text-muted-foreground text-sm mt-1">Images or videos • Max 50MB</p>
        <button
          type="button"
          className="mt-4 px-4 py-2 bg-accent/20 text-accent rounded-lg text-sm hover:bg-accent/30 transition"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          Browse Files
        </button>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {uploadedFiles.map((file, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="absolute top-1 right-1 bg-black/60 rounded-full w-5 h-5 text-xs text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {imageAnalysis && (
        <div className="p-3 bg-accent/10 border border-accent/30 rounded-xl">
          <p className="text-accent text-xs font-medium flex items-center gap-1 mb-1">
            🔍 AI detected in your image:
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">{imageAnalysis}</p>
        </div>
      )}

      {generationError && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl">
          <p className="text-danger text-xs">{generationError}</p>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <button
          type="button"
          onClick={() => handleGenerateCaption(true)}
          disabled={isGenerating}
          className="w-full py-3 bg-accent hover:bg-accent-light text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing your media...
            </>
          ) : (
            <>✨ Generate Caption & Hashtags</>
          )}
        </button>
      )}

      <div>
        <label className="text-muted-foreground text-sm mb-2 block">
          Or describe your post topic
        </label>
        <textarea
          value={manualPrompt}
          onChange={(e) => setManualPrompt(e.target.value)}
          placeholder="e.g. New product launch, startup milestone, productivity tip..."
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm resize-none h-20 focus:ring-1 focus:ring-accent focus:border-accent"
        />
        <button
          type="button"
          onClick={() => handleGenerateCaption(false)}
          disabled={isGenerating || !manualPrompt.trim()}
          className="w-full mt-2 py-2 border border-accent text-accent rounded-lg text-sm hover:bg-accent/10 transition disabled:opacity-50"
        >
          ✨ Generate from text
        </button>
      </div>

      <div>
        <label className="text-muted-foreground text-sm mb-2 block">Tone</label>
        <div className="grid grid-cols-2 gap-2">
          {TONES.map((tone) => (
            <button
              key={tone}
              type="button"
              onClick={() => setSelectedTone(tone)}
              className={cn(
                "py-2 rounded-lg text-sm border transition",
                selectedTone === tone
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted-foreground hover:border-accent/50"
              )}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export type { MediaUploaderProps };
