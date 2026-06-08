"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScreenshotGalleryProps {
  images: string[];
  toolName: string;
  className?: string;
}

export function ScreenshotGallery({ images, toolName, className }: ScreenshotGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const close = () => setLightboxIndex(null);
  const goTo = (delta: number) => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + delta + images.length) % images.length);
  };

  return (
    <>
      <div className={cn("grid gap-4 md:grid-cols-2", className)}>
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className="group overflow-hidden rounded-[24px] border border-neutral-stroke text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={`${toolName} screenshot ${index + 1}`}
              className="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-deep/90 p-4 backdrop-blur-sm">
          <button type="button" aria-label="Close gallery" onClick={close} className="absolute right-4 top-4 rounded-full border border-white/20 p-2 text-white">
            <X className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Previous screenshot" onClick={() => goTo(-1)} className="absolute left-4 rounded-full border border-white/20 p-3 text-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[lightboxIndex]}
            alt={`${toolName} screenshot`}
            className="max-h-[85vh] max-w-[90vw] rounded-[24px] border border-white/10 object-contain shadow-2xl"
          />
          <button type="button" aria-label="Next screenshot" onClick={() => goTo(1)} className="absolute right-4 rounded-full border border-white/20 p-3 text-white">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  );
}
