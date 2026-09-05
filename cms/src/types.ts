export interface Show {
  id: number;
  slug: string;
  title: string;
  section: string | null;
  synopsis: string | null;
  categories: string[];
  status: 'draft' | 'published';
  episodes_count: number;
  artworks: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Episode {
  id: string;
  show_id: number;
  show_title?: string;
  season_number: number;
  episode_number: number;
  episode_title: string;
  duration_seconds: number | null;
  language: 'en' | 'hi' | string;
  content_group: string;
  status: 'draft' | 'published';
  artworks: string[];
}

export interface ValidationIssue {
  category: string;
  entity_type: 'show' | 'episode';
  entity_id: string;
  show_title?: string;
  episode_title?: string;
  message: string;
  actionable_fix: string;
}

export interface ValidationReport {
  is_publishable: boolean;
  total_issues: number;
  issues_by_category: Record<string, ValidationIssue[]>;
  shows_with_issues: string[];
}

export interface PublishRun {
  id: number;
  run_at: string;
  triggered_by: string;
  status: 'success' | 'failed';
  shows_count: number;
  episodes_count: number;
  catalogue_hash?: string;
  error_log?: string;
}
