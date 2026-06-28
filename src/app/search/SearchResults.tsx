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

function relevanceScore(title: string, query: string): number {
  const t = title.toLowerCase();
  const q = query.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  const words = q.split(/\s+/);
  const matchCount = words.filter((w) => t.includes(w)).length;
  return (matchCount / words.length) * 40;
}

function applyFilters(items: any[], query: string, type: string, genre: string, year: string): any[] {
  let filtered = items;
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter((m) => m.title?.toLowerCase().includes(q));
  }
  if (type && type !== "all") {
    filtered = filtered.filter((m) => m.type === type);
  }
  if (genre) {
    const g = genre.toLowerCase();
    filtered = filtered.filter((m) => m.genres?.some((mg: string) => mg.toLowerCase() === g));
  }
  if (year) {
    filtered = filtered.filter((m) => String(m.year) === year || Number(m.year) === Number(year));
  }
  return filtered;
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

  const combinedResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (q) {
      // Start with API results, apply filters + sort by relevance
      const api = (apiResults || []).slice();
      const filtered = applyFilters(api.map(mapToMovieItem), query, type, genre, year);
      filtered.sort((a, b) => relevanceScore(b.title, q) - relevanceScore(a.title, q));

      // Supplement with local results if API returned too few
      if (filtered.length < 20) {
        const local = allMovies.filter((m) => {
          if (!m.title.toLowerCase().includes(q)) return false;
          if (type && type !== "all" && m.type !== type) return false;
          if (genre && !m.genres.some((g) => g.toLowerCase() === genre.toLowerCase())) return false;
          if (year && String(m.year) !== year) return false;
          return true;
        });
        const existingSlugs = new Set(filtered.map((m) => m.slug));
        const localSupplement = local.filter((m) => !existingSlugs.has(m.slug));
        localSupplement.forEach((m) => filtered.push(m));
      }

      return filtered;
    }

    // No query — filter allMovies by type/genre/year
    return allMovies.filter((m) => {
      if (type && type !== "all" && m.type !== type) return false;
      if (genre && !m.genres.some((g) => g.toLowerCase() === genre.toLowerCase())) return false;
      if (year && String(m.year) !== year) return false;
      return true;
    });
  }, [apiResults, allMovies, query, type, genre, year]);

  if (loading) {
    return <MovieGridSkeleton />;
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        {combinedResults.length} {combinedResults.length === 1 ? "result" : "results"} found
      </p>
      {combinedResults.length > 0 ? (
        <MovieGrid items={combinedResults} showType />
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
