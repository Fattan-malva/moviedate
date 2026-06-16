import { getDetail, getHome } from "./scraper";
import type { ContentItem, DetailData, HomeData } from "./scraper-types";
import type { ContentType, MovieItem, HomepageData } from "./types";

async function loadMovies(): Promise<MovieItem[]> {
  try {
    const home = await getHome();
    return uniqueBySlug(home.sections.flatMap((section) => section.items)).map((item) =>
      toMovieItem(item)
    );
  } catch {
    return [];
  }
}

async function loadHomepage(): Promise<HomepageData> {
  try {
    const home = await getHome();
    return toHomepageData(home);
  } catch {
    return { hero: [], categories: [] };
  }
}

export async function getAllMovies(): Promise<MovieItem[]> {
  return loadMovies();
}

export async function getHomepage(): Promise<HomepageData> {
  return loadHomepage();
}

export async function getMovieBySlug(slug: string): Promise<MovieItem | null> {
  const all = await getAllMovies();
  const cached = all.find((m) => m.slug === slug);
  if (cached) return cached;

  try {
    const detail = await getDetail(slug);
    return toMovieItem(detail);
  } catch {
    return null;
  }
}

export async function searchMovies(params: {
  query?: string;
  type?: string;
  genre?: string;
  year?: string;
}): Promise<MovieItem[]> {
  const all = await getAllMovies();
  return all.filter((m) => {
    if (params.query) {
      const q = params.query.toLowerCase();
      if (!m.title.toLowerCase().includes(q)) return false;
    }
    if (params.type && params.type !== "all" && m.type !== params.type) return false;
    if (params.genre) {
      if (!m.genres.map((g) => g.toLowerCase()).includes(params.genre.toLowerCase()))
        return false;
    }
    if (params.year) {
      const y = parseInt(params.year);
      if (m.year !== y) return false;
    }
    return true;
  });
}

export async function getMoviesByGenre(genre: string): Promise<MovieItem[]> {
  const all = await getAllMovies();
  return all.filter((m) =>
    m.genres.map((g) => g.toLowerCase()).includes(genre.toLowerCase())
  );
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

export function getYearRange(movies: MovieItem[]): [number, number] {
  const years = movies.map((i) => i.year).filter(Boolean);
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

function toHomepageData(home: HomeData): HomepageData {
  const allItems = uniqueBySlug(home.sections.flatMap((section) => section.items));
  const sections = home.sections.length
    ? home.sections
    : [{ name: "All Movies", slug: "all-movies", items: allItems }];

  return {
    hero: (home.hero.length ? home.hero : allItems.slice(0, 12)).map((item) => toMovieItem(item)),
    categories: sections.map((section) => ({
      name: section.name,
      type: detectContentType(section.name),
      items: section.items.map((item) => toMovieItem(item, section.name)),
    })),
  };
}

function toMovieItem(item: ContentItem | DetailData, category = "All"): MovieItem {
  const type = detectContentType(item.type || category || item.title);
  const year = Number(item.year || item.releaseDate?.match(/\b(19|20)\d{2}\b/)?.[0] || 0);
  const rating = item.rating || "";

  return {
    id: item.slug,
    slug: item.slug,
    title: item.title,
    year: Number.isFinite(year) ? year : 0,
    rating,
    duration: item.duration || "",
    country: item.country || "",
    genres: item.genres || [],
    description: item.synopsis || "",
    poster: item.thumbnail || "",
    cast: "cast" in item && item.cast ? item.cast.map((cast) => ({ actor: cast.name, character: cast.role || "" })) : [],
    episodes:
      "episodes" in item && item.episodes
        ? item.episodes.map((episode) => ({
            season: 1,
            episode: Number(episode.number) || 0,
            title: episode.title || `Episode ${episode.number}`,
          }))
        : [],
    type,
    category,
    imdbRating: Number(rating) || 0,
    reviews: [],
    url: `${process.env.URL_SCRAPPING?.replace(/\/+$/, "") ?? "https://movibox.net"}/detail/${item.slug}`,
  };
}

function detectContentType(value: string): ContentType {
  const text = value.toLowerCase();
  if (text.includes("tv")) return "tv-series";
  if (text.includes("anime") || text.includes("animation")) return "anime";
  if (text.includes("k-drama") || text.includes("kdrama")) return "kdrama";
  if (text.includes("c-drama") || text.includes("cdrama")) return "cdrama";
  if (text.includes("horror")) return "horror";
  if (text.includes("romance")) return "romance";
  if (text.includes("fantasy")) return "fantasy";
  if (text.includes("action")) return "action";
  if (text.includes("sci-fi") || text.includes("scifi")) return "scifi";
  if (text.includes("drama")) return "drama";
  if (text.includes("thriller")) return "thriller";
  if (text.includes("comedy")) return "comedy";
  return "movie";
}

function uniqueBySlug(items: ContentItem[]): ContentItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}
