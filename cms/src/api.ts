import { Show, Episode, ValidationReport, PublishRun } from './types';

const API_BASE = 'http://localhost:8000';

let currentRole: 'editor' | 'admin' = 'admin';

export const setApiRole = (role: 'editor' | 'admin') => {
  currentRole = role;
};

export const getApiRole = () => currentRole;

const getHeaders = (extraHeaders: Record<string, string> = {}) => ({
  'X-Role': currentRole,
  ...extraHeaders,
});

export const api = {
  // Shows
  async getShows(params?: { section?: string; status?: string; q?: string; skip?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.section) query.set('section', params.section);
    if (params?.status) query.set('status', params.status);
    if (params?.q) query.set('q', params.q);
    if (params?.skip !== undefined) query.set('skip', String(params.skip));
    if (params?.limit !== undefined) query.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/shows?${query.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch shows');
    return res.json() as Promise<{ total: number; shows: Show[] }>;
  },

  async getShow(idOrSlug: string) {
    const res = await fetch(`${API_BASE}/shows/${idOrSlug}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch show details');
    return res.json();
  },

  async createShow(show: Partial<Show>) {
    const res = await fetch(`${API_BASE}/shows`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(show),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create show');
    }
    return res.json() as Promise<Show>;
  },

  async updateShow(id: number, show: Partial<Show>) {
    const res = await fetch(`${API_BASE}/shows/${id}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(show),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update show');
    }
    return res.json() as Promise<Show>;
  },

  // Episodes
  async getEpisodes(params?: { show_id?: number; status?: string; language?: string; q?: string; skip?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.show_id) query.set('show_id', String(params.show_id));
    if (params?.status) query.set('status', params.status);
    if (params?.language) query.set('language', params.language);
    if (params?.q) query.set('q', params.q);
    if (params?.skip !== undefined) query.set('skip', String(params.skip));
    if (params?.limit !== undefined) query.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/episodes?${query.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch episodes');
    return res.json() as Promise<{ total: number; episodes: Episode[] }>;
  },

  async createEpisode(episode: Partial<Episode>) {
    const res = await fetch(`${API_BASE}/episodes`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(episode),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create episode');
    }
    return res.json() as Promise<Episode>;
  },

  async updateEpisode(id: string, episode: Partial<Episode>) {
    const res = await fetch(`${API_BASE}/episodes/${id}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(episode),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update episode');
    }
    return res.json() as Promise<Episode>;
  },

  // Artwork Upload
  async uploadArtwork(entityType: 'show' | 'episode', entityId: string, artworkType: 'poster' | 'banner' | 'thumbnail', file: File) {
    const formData = new FormData();
    formData.append('entity_type', entityType);
    formData.append('entity_id', entityId);
    formData.append('artwork_type', artworkType);
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/admin/artwork/upload`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Artwork upload failed');
    }
    return res.json();
  },

  // Validation & Publishing
  async getValidationReport() {
    const res = await fetch(`${API_BASE}/admin/validation-report`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to fetch validation report');
    }
    return res.json() as Promise<ValidationReport>;
  },

  async publishCatalog() {
    const res = await fetch(`${API_BASE}/admin/catalog/publish`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Publish failed');
    }
    return res.json();
  },

  async getPublishHistory() {
    const res = await fetch(`${API_BASE}/admin/publish-history`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch publish history');
    return res.json() as Promise<PublishRun[]>;
  }
};
