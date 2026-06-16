export interface ContentItem {
  slug: string;
  title: string;
  thumbnail: string;
  type?: string;
  status?: string;
  rating?: string;
  synopsis?: string;
  genres?: string[];
  releaseDate?: string;
  duration?: string;
  latestEpisode?: string;
  year?: string;
  country?: string;
}

export interface Episode {
  slug: string;
  number: string;
  title?: string;
  date?: string;
}

export interface StreamServer {
  name: string;
  url: string;
}

export interface EpisodeDetail {
  videoUrl?: string;
  streamServers?: StreamServer[];
  prev?: string;
  next?: string;
  episodes?: Episode[];
}

export interface Genre {
  name: string;
  slug: string;
  count?: number;
}

export interface ListResponse<T> {
  items: T[];
  totalPages?: number;
  currentPage?: number;
}

export interface HomeSection {
  name: string;
  slug: string;
  items: ContentItem[];
}

export interface HomeData {
  hero: ContentItem[];
  trending: HomeSection[];
  latest: HomeSection[];
  sections: HomeSection[];
}

export interface DetailData {
  slug: string;
  title: string;
  thumbnail: string;
  poster?: string;
  type?: string;
  status?: string;
  rating?: string;
  synopsis?: string;
  genres?: string[];
  releaseDate?: string;
  duration?: string;
  year?: string;
  country?: string;
  cast?: { name: string; role?: string; image?: string }[];
  episodes?: Episode[];
  streamServers?: StreamServer[];
  relatedContent?: ContentItem[];
}

export interface SearchResult extends ContentItem {}

export interface GenrePageData {
  genre: Genre;
  items: ContentItem[];
  totalPages: number;
  currentPage: number;
}

export interface Season {
  number: number;
  episodes: Episode[];
}

export interface SeriesDetailData extends DetailData {
  seasons?: Season[];
}
