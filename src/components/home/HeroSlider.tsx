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
    goTo((current + 1) % items.length);
  }, [current, items.length]);

  const prev = useCallback(() => {
    goTo((current - 1 + items.length) % items.length);
  }, [current, items.length]);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, items.length]);

  if (!loaded) {
    return (
      <section className="relative h-[50vh] md:h-[70vh] min-h-[400px] rounded-b-2xl bg-white/[0.02] animate-pulse" />
    );
  }

  if (!items.length) return null;

  const item = items[current];

  return (
    <section className="relative h-[50vh] md:h-[70vh] min-h-[400px] overflow-hidden rounded-b-2xl">
      {items.map((m, i) => (
        <div
          key={m.id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            i === current
              ? "opacity-100 scale-100"
              : "opacity-0 scale-105 pointer-events-none"
          }`}
        >
          {m.poster ? (
            <img
              src={m.poster}
              alt={m.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-900/50 to-pink-900/50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
        </div>
      ))}

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-4xl">
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 md:p-8">
          <h1 className="text-2xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
            {item.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-300 mb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/80 text-white text-xs font-medium backdrop-blur-md">
              {item.type}
            </span>
            {item.year > 0 && <span>{item.year}</span>}
            {item.duration && <span>{item.duration}</span>}
            {item.country && <span className="hidden sm:inline">{item.country}</span>}
            {item.imdbRating > 0 && (
              <span className="text-yellow-400">&#9733; {item.imdbRating.toFixed(1)}</span>
            )}
          </div>
          {item.description && (
            <p className="text-sm md:text-base text-gray-400 line-clamp-2 max-w-2xl mb-4">
              {item.description}
            </p>
          )}
          <Link
            href={`/movie/${item.slug}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full text-sm font-medium transition-all hover:shadow-lg hover:shadow-violet-500/25"
          >
            View Details
          </Link>
        </div>
      </div>

      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/[0.06] hover:bg-white/20 text-white transition-all"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/[0.06] hover:bg-white/20 text-white transition-all"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 right-6 flex gap-2">
            {items.slice(0, Math.min(items.length, 7)).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current
                    ? "bg-violet-500 w-8"
                    : "bg-white/30 hover:bg-white/50 w-1.5"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
