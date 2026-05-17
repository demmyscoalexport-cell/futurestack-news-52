"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { ReviewModal } from "./review-modal";

interface Review {
  id: string;
  user_name: string;
  rating: number;
  content: string;
  location: string | null;
  created_at: string;
  profiles?: { avatar_url?: string; full_name?: string } | null;
}

interface ReviewsSectionProps {
  toolId: string;
  toolName: string;
  initialReviews: Review[];
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200 dark:fill-slate-800 dark:text-slate-800"
          }`}
        />
      ))}
    </div>
  );
}

function formatReviewDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function ReviewsSection({
  toolId,
  toolName,
  initialReviews,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  function handleNewReview(review: Review) {
    setReviews((prev) => [review, ...prev]);
  }

  const avgRating = reviews.length
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            User Reviews
          </h2>
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-sm px-2 py-0.5 rounded-full">
            {reviews.length}
          </span>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {avgRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        <ReviewModal
          toolId={toolId}
          toolName={toolName}
          onReviewSubmitted={handleNewReview}
        />
      </div>

      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 shrink-0 overflow-hidden">
                    {review.profiles?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.profiles.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (review.user_name || "A").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-900 dark:text-white leading-none">
                      {review.profiles?.full_name || review.user_name || "Anonymous"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {review.location
                        ? `${review.location} · ${formatReviewDate(review.created_at)}`
                        : formatReviewDate(review.created_at)}
                    </p>
                  </div>
                </div>
                <StarRow rating={review.rating} />
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {review.content}
              </p>
            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-slate-500 font-medium">No reviews yet.</p>
            <p className="text-slate-400 text-sm mt-1">
              Be the first to share your experience!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
