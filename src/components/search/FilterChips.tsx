"use client";

import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FilterChips() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters: { key: string; label: string; value: string }[] = [];

  const q = searchParams.get("q");
  if (q) filters.push({ key: "q", label: `Search: "${q}"`, value: q });

  const type = searchParams.get("type");
  if (type && type !== "all") filters.push({ key: "type", label: `Type: ${type}`, value: type });

  const genre = searchParams.get("genre");
  if (genre) filters.push({ key: "genre", label: `Genre: ${genre}`, value: genre });

  const year = searchParams.get("year");
  if (year) filters.push({ key: "year", label: `Year: ${year}`, value: year });

  if (!filters.length) return null;

  const remove = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <span
          key={f.key}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20"
        >
          {f.label}
          <button onClick={() => remove(f.key)} className="hover:text-white transition-colors">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
