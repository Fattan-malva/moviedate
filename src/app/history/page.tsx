"use client";

import { useEffect, useState } from "react";
import { Clock, Trash2 } from "lucide-react";
import type { MovieItem } from "@/lib/types";
import { getAllMovies } from "@/lib/data";
import MovieGrid from "@/components/movie/MovieGrid";
import { MovieGridSkeleton } from "@/components/ui/Skeleton";

export default function HistoryPage() {
  const [historySlugs, setHistorySlugs] = useState<string[]>([]);
  const [allMovies, setAllMovies] = useState<MovieItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getAllMovies().then(setAllMovies);
    loadHistory();
  }, []);

  const loadHistory = () => {
    const stored = localStorage.getItem("moviedate_history");
    if (stored) {
      setHistorySlugs(JSON.parse(stored));
    }
    setLoaded(true);
  };

  const clearAll = () => {
    localStorage.setItem("moviedate_history", JSON.stringify([]));
    setHistorySlugs([]);
  };

  const historyMovies = allMovies
    .filter((m) => historySlugs.includes(m.slug))
    .sort((a, b) => historySlugs.indexOf(a.slug) - historySlugs.indexOf(b.slug))
    .reverse();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Clock className="w-5 h-5 text-violet-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">History</h1>
        </div>
        {historyMovies.length > 0 && (
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
        <MovieGridSkeleton count={12} />
      ) : historyMovies.length > 0 ? (
        <MovieGrid items={historyMovies} showType />
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-500 text-lg">No history yet</p>
          <p className="text-gray-600 text-sm mt-2">Movies you view will appear here</p>
        </div>
      )}
    </div>
  );
}
