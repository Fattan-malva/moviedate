import type { MovieItem } from "@/lib/types";
import MovieCard from "./MovieCard";

interface Props {
  items: MovieItem[];
  showType?: boolean;
}

export default function MovieGrid({ items, showType = false }: Props) {
  if (!items.length) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No movies found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
      {items.map((item) => (
        <MovieCard key={item.id} item={item} showType={showType} />
      ))}
    </div>
  );
}
