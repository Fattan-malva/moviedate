"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CONTENT_TYPES } from "@/lib/utils";

interface Props {
  genres: string[];
  yearRange: [number, number];
}

export default function FilterSidebar({ genres, yearRange }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentType = searchParams.get("type") || "all";
  const currentGenre = searchParams.get("genre") || "";
  const currentYear = searchParams.get("year") || "";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/search");
  };

  const hasFilters = currentType !== "all" || currentGenre || currentYear;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Filters</h3>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div>
        <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Type</h4>
        <div className="flex flex-wrap gap-2">
          {CONTENT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => updateFilter("type", t.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentType === t.value
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "bg-[#14141f] text-gray-400 border border-[#2d2d44] hover:border-violet-500/30 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Genre</h4>
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => updateFilter("genre", genre)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentGenre === genre
                  ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                  : "bg-[#14141f] text-gray-400 border border-[#2d2d44] hover:border-pink-500/30 hover:text-white"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Year</h4>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: yearRange[1] - yearRange[0] + 1 }, (_, i) => yearRange[0] + i)
            .reverse()
            .slice(0, 20)
            .map((year) => (
              <button
                key={year}
                onClick={() => updateFilter("year", String(year))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  currentYear === String(year)
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    : "bg-[#14141f] text-gray-400 border border-[#2d2d44] hover:border-violet-500/30 hover:text-white"
                }`}
              >
                {year}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
