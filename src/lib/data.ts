import type { MovieItem, CategorySection, HomepageData, ContentType } from "./types";

let cachedAll: MovieItem[] | null = null;
let cachedHomepage: HomepageData | null = null;

async function loadJSON<T>(path: string): Promise<T> {
  const mod = await import(`@/../data/${path}`);
  return mod.default as T;
}

export async function getAllMovies(): Promise<MovieItem[]> {
  if (cachedAll) return cachedAll;
  try {
    cachedAll = await loadJSON<MovieItem[]>("movies.json");
  } catch {
    cachedAll = [];
  }
  return cachedAll;
}

export async function getHomepage(): Promise<HomepageData> {
  if (cachedHomepage) return cachedHomepage;
  try {
    cachedHomepage = await loadJSON<HomepageData>("homepage.json");
  } catch {
    cachedHomepage = { hero: [], categories: [] };
  }
  return cachedHomepage;
}

export async function getMovieBySlug(slug: string): Promise<MovieItem | null> {
  const all = await getAllMovies();
  return all.find((m) => m.slug === slug) || null;
}

export async function searchMovies(params: {
  query?: string;
  type?: ContentType;
  genre?: string;
  year?: [number, number];
  country?: string;
}): Promise<MovieItem[]> {
  const all = await getAllMovies();
  return all.filter((m) => {
    if (params.query) {
      const q = params.query.toLowerCase();
      if (!m.title.toLowerCase().includes(q)) return false;
    }
    if (params.type && params.type !== "all" && m.type !== params.type) return false;
    if (params.genre && !m.genres.includes(params.genre)) return false;
    if (params.year && (m.year < params.year[0] || m.year > params.year[1])) return false;
    if (params.country && m.country !== params.country) return false;
    return true;
  });
}

export async function getMoviesByGenre(genre: string): Promise<MovieItem[]> {
  const all = await getAllMovies();
  return all.filter((m) => m.genres.includes(genre));
}

export async function getMoviesByType(type: ContentType): Promise<MovieItem[]> {
  if (type === "all") return getAllMovies();
  const all = await getAllMovies();
  return all.filter((m) => m.type === type);
}

export function getAllGenres(movies: MovieItem[]): string[] {
  const set = new Set<string>();
  movies.forEach((m) => m.genres.forEach((g) => set.add(g)));
  return Array.from(set).sort();
}

export function getAllCountries(movies: MovieItem[]): string[] {
  const set = new Set<string>();
  movies.forEach((m) => {
    if (m.country) set.add(m.country);
  });
  return Array.from(set).sort();
}
