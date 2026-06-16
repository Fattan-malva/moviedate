export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function getYearRange(items: { year: number }[]): [number, number] {
  const years = items.map((i) => i.year).filter(Boolean);
  if (!years.length) return [2024, 2026];
  return [Math.min(...years), Math.max(...years)];
}

export const CONTENT_TYPES: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "tv-series", label: "TV Series" },
  { value: "anime", label: "Anime" },
  { value: "kdrama", label: "K-Drama" },
  { value: "kshow", label: "K-Show" },
  { value: "cdrama", label: "C-Drama" },
  { value: "tagalog", label: "Tagalog" },
  { value: "english", label: "English Dubbed" },
  { value: "disney", label: "Disney" },
  { value: "marvel", label: "Marvel" },
  { value: "dc", label: "DC" },
  { value: "horror", label: "Horror" },
  { value: "romance", label: "Romance" },
  { value: "fantasy", label: "Fantasy" },
  { value: "action", label: "Action" },
  { value: "scifi", label: "Sci-Fi" },
  { value: "drama", label: "Drama" },
  { value: "thriller", label: "Thriller" },
  { value: "comedy", label: "Comedy" },
];
