"use client";

import { useEffect, useState } from "react";
import { Clock, Trash2 } from "lucide-react";
import type { MovieItem } from "@/lib/types";
import { getAllMovies } from "@/lib/data";
import MovieGrid from "@/components/movie/MovieGrid";

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
          <Clock className="w-6 h-6 text-violet-400" />
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
        <div className="text-center py-16 text-gray-500">Loading...</div>
      ) : historyMovies.length > 0 ? (
        <MovieGrid items={historyMovies} showType />
      ) : (
        <div className="text-center py-16">
          <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No history yet</p>
          <p className="text-gray-600 text-sm mt-2">Movies you view will appear here</p>
        </div>
      )}
    </div>
  );
}
