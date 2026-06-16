export type ContentType =
  | "movie" | "tv-series" | "anime" | "kdrama"
  | "kshow" | "cdrama" | "tagalog" | "english"
  | "disney" | "marvel" | "dc" | "horror"
  | "romance" | "fantasy" | "action" | "scifi"
  | "drama" | "thriller" | "comedy" | "documentary"
  | "all";

export interface CastMember {
  actor: string;
  character: string;
}

export interface Episode {
  season: number;
  episode: number;
  title: string;
  slug?: string;
}

export interface Review {
  author: string;
  rating: number;
  comment: string;
}

export interface StreamServer {
  name: string;
  url: string;
}

export interface MovieItem {
  id: string;
  slug: string;
  title: string;
  year: number;
  rating: string;
  duration: string;
  country: string;
  genres: string[];
  description: string;
  poster: string;
  cast: CastMember[];
  episodes: Episode[];
  type: ContentType;
  category: string;
  imdbRating: number;
  reviews: Review[];
  url: string;
  streamServers?: StreamServer[];
}

export interface CategorySection {
  name: string;
  type: ContentType;
  items: MovieItem[];
}

export interface HomepageData {
  hero: MovieItem[];
  categories: CategorySection[];
}

export interface SearchFilters {
  query: string;
  type: ContentType;
  genre: string;
  year: [number, number];
  country: string;
}
