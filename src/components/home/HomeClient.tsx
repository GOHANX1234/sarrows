"use client";

import { useState } from "react";
import HeroSection from "@/components/home/HeroSection";
import Top10Row from "@/components/home/Top10Row";
import ContentRow from "@/components/home/ContentRow";
import CategoryGrid from "@/components/home/CategoryGrid";
import FeaturedBanner from "@/components/home/FeaturedBanner";
import QuickFilters from "@/components/home/QuickFilters";
import { Flame, Tv, Film, Monitor, Star } from "lucide-react";

interface HomeClientProps {
  heroItems: any[];
  top10Items: any[];
  trendingMovies: any[];
  trendingAnime: any[];
  trendingWebSeries: any[];
  topRated: any[];
  latestMovies: any[];
  latestAnime: any[];
  latestWebSeries: any[];
  featuredSpotlight: any;
}

export default function HomeClient({
  heroItems,
  top10Items,
  trendingMovies,
  trendingAnime,
  trendingWebSeries,
  topRated,
  latestMovies,
  latestAnime,
  latestWebSeries,
  featuredSpotlight,
}: HomeClientProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  const showAll = activeFilter === "all";
  const showTrending = activeFilter === "all" || activeFilter === "trending";
  const showMovies = activeFilter === "all" || activeFilter === "movies";
  const showAnime = activeFilter === "all" || activeFilter === "anime";
  const showSeries = activeFilter === "all" || activeFilter === "series";
  const showTopRated = activeFilter === "all" || activeFilter === "top-rated";

  const hasContent =
    trendingMovies.length > 0 ||
    trendingAnime.length > 0 ||
    trendingWebSeries.length > 0 ||
    latestMovies.length > 0 ||
    latestAnime.length > 0 ||
    latestWebSeries.length > 0;

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Carousel */}
      <HeroSection items={heroItems} />

      {/* Main Content Container */}
      <div className="px-4 sm:px-8 lg:px-12 py-8 space-y-12 max-w-screen-2xl mx-auto">

        {/* Quick Filter Bar */}
        <QuickFilters activeFilter={activeFilter} onSelect={setActiveFilter} />

        {/* Top 10 Row */}
        {showTrending && top10Items.length > 0 && (
          <Top10Row items={top10Items} title="Top 10 Trending Today" />
        )}

        {/* Category Visual Grid */}
        {showAll && <CategoryGrid />}

        {/* Trending Movies */}
        {showMovies && trendingMovies.length > 0 && (
          <ContentRow
            title="Trending Movies"
            icon={<Flame className="w-5 h-5 text-sarrows-red" />}
            items={trendingMovies}
            type="movie"
            viewAllHref="/movies?sort=views"
          />
        )}

        {/* Popular Anime */}
        {showAnime && trendingAnime.length > 0 && (
          <ContentRow
            title="Popular Anime"
            icon={<Tv className="w-5 h-5 text-sarrows-red" />}
            items={trendingAnime}
            type="series"
            viewAllHref="/anime?sort=views"
          />
        )}

        {/* Mid-Page Spotlight Banner */}
        {showAll && featuredSpotlight && (
          <FeaturedBanner item={featuredSpotlight} />
        )}

        {/* Trending Web Series */}
        {showSeries && trendingWebSeries.length > 0 && (
          <ContentRow
            title="Trending Web Series"
            icon={<Monitor className="w-5 h-5 text-sarrows-red" />}
            items={trendingWebSeries}
            type="series"
            viewAllHref="/series?sort=views"
          />
        )}

        {/* Top Rated Block */}
        {showTopRated && topRated.length > 0 && (
          <ContentRow
            title="Critically Acclaimed & Top Rated"
            icon={<Star className="w-5 h-5 text-yellow-400 fill-current" />}
            items={topRated}
            type="movie"
            viewAllHref="/movies?sort=rating"
          />
        )}

        {/* Latest Movies */}
        {showMovies && latestMovies.length > 0 && (
          <ContentRow
            title="Latest Movies"
            icon={<Film className="w-5 h-5 text-sarrows-red" />}
            items={latestMovies}
            type="movie"
            viewAllHref="/movies"
          />
        )}

        {/* New Anime */}
        {showAnime && latestAnime.length > 0 && (
          <ContentRow
            title="New Anime Releases"
            icon={<Tv className="w-5 h-5 text-sarrows-red" />}
            items={latestAnime}
            type="series"
            viewAllHref="/anime"
          />
        )}

        {/* New Web Series */}
        {showSeries && latestWebSeries.length > 0 && (
          <ContentRow
            title="New Web Series"
            icon={<Monitor className="w-5 h-5 text-sarrows-red" />}
            items={latestWebSeries}
            type="series"
            viewAllHref="/series"
          />
        )}

        {!hasContent && (
          <div className="text-center py-24 glass rounded-3xl border border-white/10 my-10 max-w-md mx-auto">
            <p className="text-gray-400 text-base font-medium">No content published yet.</p>
            <p className="text-gray-500 text-xs mt-1">Add movies or series from the admin dashboard.</p>
          </div>
        )}

      </div>
    </div>
  );
}
