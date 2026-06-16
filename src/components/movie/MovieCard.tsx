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
      className="group flex-shrink-0 w-[140px] md:w-[160px] flex flex-col"
    >
      {/* Poster wrapper - fixed size 140x210 (mobile) / 160x240 (desktop) */}
      <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-[#1a1a2e] border border-white/5 transition-all duration-300 group-hover:border-violet-500/50 group-hover:shadow-lg group-hover:shadow-violet-500/20 group-hover:-translate-y-1">
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-2 bg-gradient-to-br from-violet-900/30 to-pink-900/30">
            <span className="text-gray-400 text-[10px] text-center line-clamp-3 leading-tight">
              {item.title}
            </span>
          </div>
        )}
        {/* Top-left type badge */}
        {showType && item.type && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-semibold rounded bg-violet-600/90 text-white backdrop-blur-sm capitalize tracking-wide">
            {item.type}
          </span>
        )}
        {/* Top-right rating badge */}
        {item.imdbRating > 0 && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/60 text-[9px] font-bold text-yellow-400 backdrop-blur-sm">
            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
            {item.imdbRating.toFixed(1)}
          </div>
        )}
        {/* Hover overlay with glass effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Info below poster */}
      <div className="mt-2 px-0.5 flex flex-col gap-0.5">
        <h3 className="text-xs md:text-[13px] font-medium text-gray-200 truncate group-hover:text-violet-400 transition-colors leading-tight">
          {item.title}
        </h3>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          {item.year > 0 && <span>{item.year}</span>}
          {item.duration && (
            <>
              <span className="text-gray-600">•</span>
              <span className="truncate max-w-[60px]">{item.duration}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}