"use client";

import { useState } from "react";
import { Star, Trash2, MessageSquare, Loader2 } from "lucide-react";

interface ReviewSectionProps {
  targetType: "Movie" | "Series";
  targetId: string;
  reviews: any[];
  userId?: string;
}

export default function ReviewSection({ targetType, targetId, reviews: initial, userId }: ReviewSectionProps) {
  const [reviews, setReviews]   = useState(initial);
  const [rating, setRating]     = useState(8);
  const [comment, setComment]   = useState("");
  const [hovered, setHovered]   = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState("");

  const userReview = reviews.find((r) => r.user?._id === userId || r.user?.toString() === userId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, rating, comment }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit review");
        return;
      }
      const data = await res.json();
      setReviews([data.review, ...reviews.filter((r) => r._id !== data.review._id)]);
      setComment("");
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (id: string) => {
    try {
      await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      setReviews(reviews.filter((r) => r._id !== id));
    } catch {}
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <MessageSquare className="w-5 h-5 text-sarrows-red flex-none" />
        <h2 className="section-title mb-0">Reviews ({reviews.length})</h2>
      </div>

      {/* Write a review */}
      {userId && !userReview && (
        <form
          onSubmit={submit}
          className="rounded-xl p-4 sm:p-5 mb-8"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <h3 className="text-white font-semibold text-sm sm:text-base mb-4">Write a Review</h3>

          {/* Rating row — fully contained on mobile */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Your Rating</span>
              <span className="text-white font-bold text-sm tabular-nums">
                {rating} <span className="text-gray-500 font-normal">/ 10</span>
              </span>
            </div>
            {/* Stars in a single flex row — use gap-0.5 + small stars so all 10 fit */}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(n)}
                  className="flex-1 flex justify-center py-1 transition-transform active:scale-90"
                  aria-label={`Rate ${n}`}
                >
                  <Star
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                      n <= (hovered || rating) ? "text-yellow-400 fill-current" : "text-gray-700"
                    }`}
                  />
                </button>
              ))}
            </div>
            {/* Progress bar hint */}
            <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-yellow-400 transition-all duration-200"
                style={{ width: `${((hovered || rating) / 10) * 100}%` }}
              />
            </div>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts… (optional)"
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none resize-none transition-all duration-200 focus:ring-2 focus:ring-sarrows-red/20"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
          />
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-3 btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting…</>
            ) : "Submit Review"}
          </button>
        </form>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-600">
          <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No reviews yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full flex-none flex items-center justify-center text-sarrows-red font-bold text-sm"
                    style={{ background: "rgba(229,9,20,0.15)", border: "1px solid rgba(229,9,20,0.25)" }}>
                    {review.user?.nickname?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{review.user?.nickname || "User"}</p>
                    {/* Compact star display */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex items-center gap-px">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                          <Star
                            key={n}
                            className={`w-2.5 h-2.5 ${n <= review.rating ? "text-yellow-400 fill-current" : "text-gray-700"}`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-gray-500 font-medium">{review.rating}/10</span>
                    </div>
                  </div>
                </div>
                {(userId === review.user?._id || userId === review.user?.toString()) && (
                  <button
                    onClick={() => deleteReview(review._id)}
                    className="text-gray-600 hover:text-red-400 transition flex-none p-1"
                    aria-label="Delete review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {review.comment && (
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">{review.comment}</p>
              )}
              <p className="text-xs text-gray-700 mt-2">
                {new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
