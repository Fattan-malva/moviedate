import { Star } from "lucide-react";
import type { MovieItem } from "@/lib/types";
import Link from "next/link";

interface Props {
  item: MovieItem;
  showType?: boolean;
}

export default function MovieCard({ item, showType = false }: Props) {
  return (
    <Link
      href={`/movie/${item.slug}`}
      className="group flex-shrink-0 w-[160px] md:w-[180px]"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl transition-all duration-500 group-hover:border-violet-500/40 group-hover:shadow-lg group-hover:shadow-violet-500/10 group-hover:-translate-y-1">
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm p-4 text-center bg-gradient-to-br from-violet-900/20 to-pink-900/20">
            {item.title}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {showType && item.type && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-500/80 text-white backdrop-blur-md capitalize">
            {item.type}
          </span>
        )}
        {item.imdbRating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-yellow-500/80 text-[10px] font-bold text-black backdrop-blur-md">
            <Star className="w-2.5 h-2.5 fill-current" />
            {item.imdbRating.toFixed(1)}
          </div>
        )}
        {/* Glass overlay bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="mt-2.5 px-0.5">
        <h3 className="text-sm font-medium text-gray-200 truncate group-hover:text-violet-400 transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
          {item.year > 0 && <span>{item.year}</span>}
          {item.duration && (
            <>
              <span className="text-gray-700">•</span>
              <span>{item.duration}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
