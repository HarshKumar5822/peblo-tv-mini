import { CatalogueResponse, SearchResponse } from './types';

const API_BASE = 'http://localhost:8000';

export const viewerApi = {
  async getCatalogue(): Promise<CatalogueResponse> {
    const res = await fetch(`${API_BASE}/catalog`);
    if (!res.ok) {
      throw new Error('Failed to load published catalogue');
    }
    return res.json();
  },

  async searchCatalogue(params: { q?: string; category?: string; language?: string; section?: string }): Promise<SearchResponse> {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.category) query.set('category', params.category);
    if (params.language) query.set('language', params.language);
    if (params.section) query.set('section', params.section);

    const res = await fetch(`${API_BASE}/catalog/search?${query.toString()}`);
    if (!res.ok) {
      throw new Error('Failed to execute search');
    }
    return res.json();
  }
};
