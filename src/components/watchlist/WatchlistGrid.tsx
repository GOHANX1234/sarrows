"use client";

import ContentCard from "@/components/cards/ContentCard";
import { Heart } from "lucide-react";

interface Props {
  items: any[];
}

export default function WatchlistGrid({ items }: Props) {
  const populated = items.filter((i) => i.content);

  if (!populated.length) {
    return (
      <div className="text-center py-24 text-gray-500">
        <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium text-white mb-1">Your watchlist is empty</p>
        <p className="text-sm">Start adding movies and anime to watch later</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {populated.map((item) => (
        <ContentCard
          key={item._id}
          item={item.content}
          type={item.targetType === "Movie" ? "movie" : "series"}
        />
      ))}
    </div>
  );
}
