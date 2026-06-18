"use client";

import { useState, useEffect, useMemo } from "react";
import type { MovieItem } from "@/lib/types";
import MovieGrid from "@/components/movie/MovieGrid";
import { MovieGridSkeleton } from "@/components/ui/Skeleton";

interface SearchItem {
  slug: string;
  title: string;
  thumbnail: string;
  type?: string;
  rating?: string;
  year?: string;
  genres?: string[];
}

interface Props {
  allMovies: MovieItem[];
  query: string;
  type: string;
  genre: string;
  year: string;
}

export default function SearchResults({ allMovies, query, type, genre, year }: Props) {
  const [apiResults, setApiResults] = useState<SearchItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setApiResults(null);
      return;
    }
    setLoading(true);
    fetch(`/api/scraper/search?q=${encodeURIComponent(query.trim())}`)
      .then((r) => r.json())
      .then((data) => {
        setApiResults(data.items || []);
      })
      .catch(() => {
        setApiResults([]);
      })
      .finally(() => setLoading(false));
  }, [query]);

  const localResults = useMemo(() => {
    return allMovies.filter((m) => {
      if (query) {
        const q = query.toLowerCase();
        if (!m.title.toLowerCase().includes(q)) return false;
      }
      if (type && type !== "all" && type !== "") {
        if (m.type !== type) return false;
      }
      if (genre) {
        if (!m.genres.map((g) => g.toLowerCase()).includes(genre.toLowerCase())) return false;
      }
      if (year) {
        const y = parseInt(year);
        if (m.year !== y) return false;
      }
      return true;
    });
  }, [allMovies, query, type, genre, year]);

  const isSearching = !!query.trim();

  function mapToMovieItem(item: any): MovieItem {
    return {
      id: item.slug,
      slug: item.slug,
      title: item.title,
      year: item.year ? Number(item.year) : 0,
      rating: item.rating || "",
      duration: "",
      country: "",
      genres: item.genres || [],
      description: "",
      poster: item.thumbnail || item.poster || "",
      cast: [],
      episodes: [],
      type: (item.type as any) || "movie",
      category: "",
      imdbRating: Number(item.rating) || 0,
      reviews: [],
      url: "",
    };
  }

  const displayItems = isSearching ? (apiResults || []).map(mapToMovieItem) : localResults;

  if (loading) {
    return <MovieGridSkeleton />;
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        {displayItems.length} {displayItems.length === 1 ? "result" : "results"} found
      </p>
      {displayItems.length > 0 ? (
        <MovieGrid items={displayItems} showType />
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">No results found</p>
          <p className="text-gray-600 text-sm mt-2">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
