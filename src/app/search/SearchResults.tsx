"use client";

import { useMemo } from "react";
import type { MovieItem } from "@/lib/types";
import MovieGrid from "@/components/movie/MovieGrid";

interface Props {
  allMovies: MovieItem[];
  query: string;
  type: string;
  genre: string;
  year: string;
}

export default function SearchResults({ allMovies, query, type, genre, year }: Props) {
  const results = useMemo(() => {
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

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        {results.length} {results.length === 1 ? "result" : "results"} found
      </p>
      {results.length > 0 ? (
        <MovieGrid items={results} showType />
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No results found</p>
          <p className="text-gray-600 text-sm mt-2">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
