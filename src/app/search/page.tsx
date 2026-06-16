import { getAllMovies, getAllGenres, getYearRange } from "@/lib/data";
import SearchBar from "@/components/search/SearchBar";
import FilterSidebar from "@/components/search/FilterSidebar";
import FilterChips from "@/components/search/FilterChips";
import SearchResults from "./SearchResults";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; genre?: string; year?: string }>;
}) {
  const params = await searchParams;
  const allMovies = await getAllMovies();
  const genres = getAllGenres(allMovies);
  const yearRange = getYearRange(allMovies);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">Search</h1>
      <div className="mb-6">
        <SearchBar initialQuery={params.q || ""} />
      </div>
      <div className="mb-4">
        <FilterChips />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 shrink-0">
          <FilterSidebar
            genres={genres}
            yearRange={yearRange}
          />
        </aside>
        <main className="flex-1 min-w-0">
          <SearchResults
            allMovies={allMovies}
            query={params.q || ""}
            type={params.type || "all"}
            genre={params.genre || ""}
            year={params.year || ""}
          />
        </main>
      </div>
    </div>
  );
}
