"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MovieItem } from "@/lib/types";
import Link from "next/link";

interface Props {
  items: MovieItem[];
}

export default function HeroSlider({ items }: Props) {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, items.length]);

  if (!loaded) {
    return (
      <div className="w-full h-[280px] md:h-[420px] bg-white/[0.02] animate-pulse" />
    );
  }

  // Filter valid hero items
  const validItems = items.filter(i => i.poster && i.title && i.title.length > 1);
  if (!validItems.length) return null;

  const item = validItems[current];

  return (
    <div className="w-full relative">
      {/* Hero section */}
      <div className="relative w-full h-[280px] md:h-[420px] overflow-hidden bg-[#0a0000]">
        {validItems.map((m, i) => (
          <div
            key={m.slug || i}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === current ? "opacity-100 z-[1]" : "opacity-0 z-[0]"
            }`}
          >
            {/* Backdrop image */}
            {m.poster && (
              <img
                src={m.poster}
                alt={m.title}
                className="w-full h-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0000] via-[#0a0000]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0000]/80 via-transparent to-transparent" />
          </div>
        ))}
      </div>

      {/* Info card */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 md:px-8 pb-6 md:pb-10">
        <div className="max-w-2xl">
          <div className="backdrop-blur-md bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 md:px-6 md:py-4">
            <h1 className="text-lg md:text-3xl font-bold text-white mb-1 drop-shadow-lg leading-tight line-clamp-2">
              {item.title}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-gray-300 mb-2">
              {item.type && (
                <span className="px-1.5 py-0.5 rounded-full bg-violet-600/80 text-white text-[9px] md:text-[11px] font-semibold backdrop-blur-sm capitalize">
                  {item.type}
                </span>
              )}
              {item.year > 0 && <span className="text-gray-400">{item.year}</span>}
              {item.duration && <span className="text-gray-400">{item.duration}</span>}
              {item.country && (
                <span className="hidden sm:inline text-gray-400">{item.country}</span>
              )}
              {item.imdbRating > 0 && (
                <span className="text-yellow-400 text-[10px] md:text-xs font-bold">
                  ★ {item.imdbRating.toFixed(1)}
                </span>
              )}
            </div>
            {item.description && (
              <p className="text-[10px] md:text-xs text-gray-400 line-clamp-2 mb-2 hidden md:block">
                {item.description}
              </p>
            )}
            <Link
              href={`/movie/${item.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-5 md:py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[11px] md:text-sm font-medium transition-all hover:shadow-lg hover:shadow-violet-500/25"
            >
              Watch Now
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {validItems.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 right-4 flex gap-1.5 z-10">
            {validItems.slice(0, 7).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current
                    ? "bg-violet-500 w-6"
                    : "bg-white/30 hover:bg-white/50 w-1.5"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}