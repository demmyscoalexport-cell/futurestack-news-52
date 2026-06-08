"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ToolVideo, youtubeEmbedUrl } from "@/lib/tool-intelligence";

interface YoutubeLearningCenterProps {
  videos: ToolVideo[];
  toolName: string;
  className?: string;
}

function youtubeThumbnail(url: string, fallback?: string): string {
  if (fallback) return fallback;
  const id = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/)?.[1];
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

export function YoutubeLearningCenter({ videos, toolName, className }: YoutubeLearningCenterProps) {
  const featured = videos.find((video) => video.featured) ?? videos[0];
  const [active, setActive] = useState(featured);
  const others = videos.filter((video) => video.youtubeUrl !== active?.youtubeUrl);

  if (!active) return null;

  return (
    <div className={cn("space-y-5", className)}>
      <div className="overflow-hidden rounded-[28px] border border-neutral-stroke bg-neutral-surface/40">
        <iframe
          src={youtubeEmbedUrl(active.youtubeUrl)}
          title={active.title}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <div className="border-t border-neutral-stroke p-5">
          <p className="text-lg font-bold text-foreground">{active.title}</p>
          {active.creator && <p className="mt-1 text-sm text-muted-foreground">by {active.creator}</p>}
        </div>
      </div>

      {others.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((video) => {
            const thumb = youtubeThumbnail(video.youtubeUrl, video.thumbnail);
            return (
              <button
                key={video.youtubeUrl}
                type="button"
                onClick={() => setActive(video)}
                className="overflow-hidden rounded-[20px] border border-neutral-stroke bg-neutral-surface/60 text-left transition-colors hover:border-brand-primary/40"
              >
                <div className="relative aspect-video bg-neutral-deep">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={video.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <PlayCircle className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <PlayCircle className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 text-sm font-semibold text-foreground">{video.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{toolName} tutorial</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
