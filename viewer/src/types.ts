export interface Variant {
  episode_id: string;
  episode_title: string;
  duration_seconds: number | null;
}

export interface ArtworkMap {
  poster?: string;
  banner?: string;
  thumbnail?: string;
}

export interface CollapsedEpisode {
  content_group: string;
  season_number: number;
  episode_number: number;
  default_title: string;
  languages: string[];
  variants: Record<string, Variant>;
  artwork: ArtworkMap;
}

export interface Season {
  season_number: number;
  episodes: CollapsedEpisode[];
}

export interface ShowCatalogueItem {
  id: number;
  slug: string;
  title: string;
  section: string;
  synopsis: string;
  categories: string[];
  artwork: ArtworkMap;
  trailers: CollapsedEpisode[]; // Season 0 trailers & teasers
  seasons: Season[]; // Normal seasons (Season 1, 2...)
  total_episodes: number;
}

export interface CatalogueResponse {
  version: string;
  published_at: string;
  sections: Record<string, ShowCatalogueItem[]>;
  all_shows: ShowCatalogueItem[];
  meta: {
    total_shows: number;
    total_episodes: number;
    total_collapsed_episodes: number;
  };
}

export interface SearchResponse {
  query?: string;
  filters: {
    category?: string;
    language?: string;
    section?: string;
  };
  total_results: number;
  sections: Record<string, ShowCatalogueItem[]>;
  results: ShowCatalogueItem[];
}
