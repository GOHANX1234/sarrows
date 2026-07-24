"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import ContentCard from "@/components/cards/ContentCard";
import Link from "next/link";
import type { ReactNode } from "react";

interface ContentRowProps {
  title: string;
  icon?: ReactNode;
  items: any[];
  type: "movie" | "series";
  viewAllHref?: string;
}

export default function ContentRow({ title, icon, items, type, viewAllHref }: ContentRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = rowRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const cardW = card ? card.offsetWidth + 12 : 180;
    el.scrollBy({ left: dir === "right" ? cardW * 3 : -cardW * 3, behavior: "smooth" });
  };

  if (!items.length) return null;

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="section-title flex items-center gap-2 text-sm sm:text-base">
          {icon}
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-sarrows-red transition-colors font-medium"
            >
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          )}
          {/* Scroll arrows — desktop only */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="w-7 h-7 rounded-xl glass flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="w-7 h-7 rounded-xl glass flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scroll rail */}
      <div
        ref={rowRef}
        className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {items.map((item) => (
          <div
            key={item._id}
            data-card
            className="flex-none w-[130px] sm:w-[155px] md:w-[175px] lg:w-[185px]"
            style={{ scrollSnapAlign: "start" }}
          >
            <ContentCard item={item} type={type} />
          </div>
        ))}
      </div>
    </section>
  );
}
