"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MovieItem } from "@/lib/types";
import MovieCard from "../movie/MovieCard";

interface Props {
  title: string;
  items: MovieItem[];
  showType?: boolean;
}

export default function CategoryRow({ title, items, showType = false }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    const dist = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: dir === "left" ? -dist : dist, behavior: "smooth" });
  };

  const updateArrows = () => {
    if (!rowRef.current) return;
    setShowLeft(rowRef.current.scrollLeft > 10);
    setShowRight(rowRef.current.scrollLeft < rowRef.current.scrollWidth - rowRef.current.clientWidth - 10);
  };

  if (!items.length) return null;

  return (
    <section className="relative group">
      <h2 className="text-lg md:text-xl font-bold text-white mb-4">{title}</h2>
      <div className="relative">
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-10 w-10 md:w-12 bg-gradient-to-r from-[#0a0a0f]/90 to-transparent flex items-center justify-start opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        <div
          ref={rowRef}
          onScroll={updateArrows}
          className="flex gap-3 overflow-x-auto hide-scrollbar snap-x snap-mandatory scroll-smooth pb-2"
        >
          {items.map((item) => (
            <div key={item.id} className="snap-start">
              <MovieCard item={item} showType={showType} />
            </div>
          ))}
        </div>
        {showRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-10 w-10 md:w-12 bg-gradient-to-l from-[#0a0a0f]/90 to-transparent flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </section>
  );
}
