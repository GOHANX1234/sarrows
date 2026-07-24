"use client";

import { useEffect } from "react";

interface ViewTrackerProps {
  targetType: "Movie" | "Series" | "Episode";
  targetId: string;
  userId?: string;
}

export default function ViewTracker({ targetType, targetId, userId }: ViewTrackerProps) {
  useEffect(() => {
    if (!userId || !targetId) return;
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId }),
    }).catch(() => {});
  }, [targetType, targetId, userId]);

  return null;
}
