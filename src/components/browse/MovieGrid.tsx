"use client";

import Link from "next/link";
import ContentCard from "@/components/cards/ContentCard";
import { ChevronLeft, ChevronRight, Film } from "lucide-react";

interface MovieGridProps {
  items: any[];
  type: "movie" | "series";
  page: number;
  totalPages: number;
  basePath: string;
  currentParams: Record<string, string | undefined>;
}

export default function MovieGrid({ items, type, page, totalPages, basePath, currentParams }: MovieGridProps) {
  const buildUrl = (p: number) => {
    const params = new URLSearchParams();
    Object.entries(currentParams).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set("page", p.toString());
    return `${basePath}?${params.toString()}`;
  };

  if (!items.length) {
    return (
      <div className="text-center py-24">
        <Film className="w-12 h-12 mx-auto mb-3 text-gray-700" />
        <p className="text-gray-500 font-medium">No content found</p>
        <p className="text-gray-700 text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div>
      {/* Grid — 2 cols on small mobile, 3 on sm, 4 on md, 5 on lg, 6 on xl */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {items.map((item) => (
          <ContentCard key={item._id} item={item} type={type} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          {page > 1 ? (
            <Link
              href={buildUrl(page - 1)}
              className="flex items-center gap-1.5 btn-secondary text-sm py-2 px-4"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 text-sm py-2 px-4 text-gray-700 cursor-default select-none">
              <ChevronLeft className="w-4 h-4" /> Prev
            </span>
          )}

          <span className="text-gray-400 text-sm px-2 tabular-nums">
            {page} <span className="text-gray-700">/ {totalPages}</span>
          </span>

          {page < totalPages ? (
            <Link
              href={buildUrl(page + 1)}
              className="flex items-center gap-1.5 btn-secondary text-sm py-2 px-4"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 text-sm py-2 px-4 text-gray-700 cursor-default select-none">
              Next <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
