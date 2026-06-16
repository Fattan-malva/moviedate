"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MovieItem } from "@/lib/types";
import MovieCard from "../movie/MovieCard";
import { MovieCardSkeleton } from "../ui/Skeleton";

interface Props {
  title: string;
  items: MovieItem[];
  showType?: boolean;
}

export default function CategoryRow({ title, items, showType = false }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    const dist = rowRef.current.clientWidth * 0.7;
    rowRef.current.scrollBy({ left: dir === "left" ? -dist : dist, behavior: "smooth" });
  };

  const updateArrows = () => {
    if (!rowRef.current) return;
    setShowLeft(rowRef.current.scrollLeft > 20);
    setShowRight(
      rowRef.current.scrollLeft <
        rowRef.current.scrollWidth - rowRef.current.clientWidth - 20
    );
  };

  const validItems = items.filter((item) => item && item.title && item.title.length > 1);

  if (!loaded) {
    return (
      <section className="w-full">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-36 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (!validItems.length) return null;

  return (
    <section className="w-full">
      {/* Section title */}
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm md:text-base font-semibold text-white">{title}</h2>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* Row with scroll */}
      <div className="relative group">
        {/* Left gradient + arrow */}
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-start pl-1 bg-gradient-to-r from-[#0a0a0f] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-sm hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-4 h-4 text-white" />
            </div>
          </button>
        )}

        {/* Scrollable items */}
        <div
          ref={rowRef}
          onScroll={updateArrows}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 hide-scrollbar"
        >
          {/* Left padding for first card */}
          <div className="w-1 flex-shrink-0" />
          {validItems.map((item) => (
            <MovieCard key={item.id || item.slug} item={item} showType={showType} />
          ))}
          {/* Right padding for last card */}
          <div className="w-1 flex-shrink-0" />
        </div>

        {/* Right gradient + arrow */}
        {showRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-end pr-1 bg-gradient-to-l from-[#0a0a0f] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-sm hover:bg-white/20 transition-colors">
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
          </button>
        )}
      </div>
    </section>
  );
}