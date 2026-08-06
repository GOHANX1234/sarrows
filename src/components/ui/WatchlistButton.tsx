"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  targetType: "Movie" | "Series";
  targetId: string;
  userId: string;
  className?: string;
}

export default function WatchlistButton({ targetType, targetId, userId, className }: Props) {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/watchlist?targetType=${targetType}&targetId=${targetId}`)
      .then((r) => r.json())
      .then((d) => { setInWatchlist(d.inWatchlist); setLoading(false); })
      .catch(() => setLoading(false));
  }, [targetType, targetId]);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/watchlist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      const data = await res.json();
      setInWatchlist(data.inWatchlist);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 btn-secondary text-sm transition",
        inWatchlist && "border-sarrows-red/30 text-sarrows-red bg-sarrows-red/5",
        className
      )}
    >
      <Heart className={cn("w-4 h-4 transition", inWatchlist && "fill-current text-sarrows-red")} />
      {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
    </button>
  );
}
