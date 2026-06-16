"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CONTENT_TYPES } from "@/lib/data";

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

  const btnClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
      active
        ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
        : "bg-white/[0.03] text-gray-400 border-white/[0.06] hover:border-violet-500/30 hover:text-white hover:bg-white/[0.06]"
    }`;

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
              className={btnClass(currentType === t.value)}
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
              className={btnClass(currentGenre === genre)}
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
                className={btnClass(currentYear === String(year))}
              >
                {year}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
