"use client";

import { useEffect, useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import type { MovieItem } from "@/lib/types";
import { getAllMovies } from "@/lib/data";
import MovieGrid from "@/components/movie/MovieGrid";

export default function BookmarkPage() {
  const [bookmarkedSlugs, setBookmarkedSlugs] = useState<string[]>([]);
  const [allMovies, setAllMovies] = useState<MovieItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getAllMovies().then(setAllMovies);
    loadBookmarks();
    const handler = () => loadBookmarks();
    window.addEventListener("bookmark-changed", handler);
    return () => window.removeEventListener("bookmark-changed", handler);
  }, []);

  const loadBookmarks = () => {
    const stored = localStorage.getItem("moviedate_bookmarks");
    if (stored) {
      setBookmarkedSlugs(Object.keys(JSON.parse(stored)));
    }
    setLoaded(true);
  };

  const clearAll = () => {
    localStorage.setItem("moviedate_bookmarks", JSON.stringify({}));
    setBookmarkedSlugs([]);
    window.dispatchEvent(new Event("bookmark-changed"));
  };

  const bookmarkedMovies = allMovies.filter((m) => bookmarkedSlugs.includes(m.slug));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-pink-400" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">Bookmarks</h1>
        </div>
        {bookmarkedMovies.length > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {!loaded ? (
        <div className="text-center py-16 text-gray-500">Loading...</div>
      ) : bookmarkedMovies.length > 0 ? (
        <MovieGrid items={bookmarkedMovies} showType />
      ) : (
        <div className="text-center py-16">
          <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No bookmarks yet</p>
          <p className="text-gray-600 text-sm mt-2">Save movies to quickly find them later</p>
        </div>
      )}
    </div>
  );
}
