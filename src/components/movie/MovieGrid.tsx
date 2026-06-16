import type { MovieItem } from "@/lib/types";
import MovieCard from "./MovieCard";

interface Props {
  items: MovieItem[];
  showType?: boolean;
}

export default function MovieGrid({ items, showType = false }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {items.map((item) => (
        <MovieCard key={item.id} item={item} showType={showType} />
      ))}
    </div>
  );
}
