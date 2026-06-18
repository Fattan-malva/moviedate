"use client";

import { Search, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface Suggestion {
  slug: string;
  title: string;
  thumbnail: string;
  type?: string;
  year?: string;
}

export default function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoading(true);
    fetch(`/api/scraper/search?q=${encodeURIComponent(q.trim())}`)
      .then((r) => r.json())
      .then((data) => {
        const items: Suggestion[] = (data.items || []).slice(0, 8);
        setSuggestions(items);
        setShowSuggestions(items.length > 0);
      })
      .catch(() => {
        setSuggestions([]);
        setShowSuggestions(false);
      })
      .finally(() => setLoading(false));
  };

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const selectSuggestion = (slug: string) => {
    setShowSuggestions(false);
    router.push(`/movie/${slug}`);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={submit} className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          placeholder="Search movies, TV shows, anime..."
          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-3.5 pl-12 pr-12 text-base text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.06] transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setSuggestions([]); setShowSuggestions(false); inputRef.current?.focus(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          </button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0e0e14] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl shadow-black/60 z-50">
          {suggestions.map((item) => (
            <button
              key={item.slug}
              onClick={() => selectSuggestion(item.slug)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.05] transition-colors text-left"
            >
              {item.thumbnail ? (
                <div className="w-10 h-14 shrink-0 rounded-lg overflow-hidden bg-white/[0.05]">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="w-10 h-14 shrink-0 rounded-lg bg-white/[0.05] flex items-center justify-center">
                  <Search className="w-4 h-4 text-gray-600" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">{item.title}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  {item.year && <span>{item.year}</span>}
                  {item.type && <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06]">{item.type}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
