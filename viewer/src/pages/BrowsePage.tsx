import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { HeroBanner } from '../components/HeroBanner';
import { FilterBar } from '../components/FilterBar';
import { SectionRow } from '../components/SectionRow';
import { ShowDetailModal } from '../components/ShowDetailModal';
import { Footer } from '../components/Footer';
import { viewerApi } from '../api';
import { ShowCatalogueItem, CatalogueResponse } from '../types';
import { Film } from 'lucide-react';

export const BrowsePage: React.FC = () => {
  const [catalogue, setCatalogue] = useState<CatalogueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Theme State ('dark' | 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('peblo_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('peblo_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  const [selectedShow, setSelectedShow] = useState<ShowCatalogueItem | null>(null);

  const fetchCatalogueData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (searchQuery || categoryFilter || languageFilter || sectionFilter) {
        const searchRes = await viewerApi.searchCatalogue({
          q: searchQuery || undefined,
          category: categoryFilter || undefined,
          language: languageFilter || undefined,
          section: sectionFilter || undefined,
        });
        setCatalogue({
          version: '1.0',
          published_at: new Date().toISOString(),
          sections: searchRes.sections,
          all_shows: searchRes.results,
          meta: {
            total_shows: searchRes.total_results,
            total_episodes: 0,
            total_collapsed_episodes: 0,
          },
        });
      } else {
        const data = await viewerApi.getCatalogue();
        setCatalogue(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load published catalogue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogueData();
  }, [searchQuery, categoryFilter, languageFilter, sectionFilter]);

  const hasHeroBanner = !searchQuery && !categoryFilter && !languageFilter && !sectionFilter && !!catalogue?.all_shows?.[0];
  const featuredShow = catalogue?.all_shows?.[0] || null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      <Header
        activeSection={sectionFilter}
        onSelectSection={(sec) => setSectionFilter(sec)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Hero Banner (Only when no active search/filters) */}
      {hasHeroBanner && featuredShow && (
        <HeroBanner show={featuredShow} onOpenDetail={(show) => setSelectedShow(show)} />
      )}

      {/* Main Content Area with Clean Top Padding to prevent Header Overlap */}
      <div style={{ paddingTop: hasHeroBanner ? '0px' : '90px', flex: 1 }}>
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          languageFilter={languageFilter}
          setLanguageFilter={setLanguageFilter}
          isStandalone={!hasHeroBanner}
        />

        <main className="rows-section">
          {loading ? (
            <div className="empty-state">
              <p>Loading catalogue content...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <p style={{ color: 'var(--accent-red)' }}>⚠️ {error}</p>
              <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
                Make sure a catalogue has been published via the CMS!
              </p>
            </div>
          ) : !catalogue || catalogue.all_shows.length === 0 ? (
            <div className="empty-state">
              <Film size={48} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
              <h3>No shows found matching your search or filters</h3>
              <p style={{ fontSize: '0.88rem', marginTop: '6px' }}>
                Try adjusting your search query, section, category, or language filters.
              </p>
            </div>
          ) : (
            <div>
              {Object.entries(catalogue.sections).map(([sectionName, shows]) => (
                <SectionRow
                  key={sectionName}
                  title={sectionName}
                  shows={shows}
                  onSelectShow={(show) => setSelectedShow(show)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer onSelectSection={(sec) => setSectionFilter(sec)} />

      {/* Show Detail Modal */}
      {selectedShow && (
        <ShowDetailModal show={selectedShow} onClose={() => setSelectedShow(null)} />
      )}
    </div>
  );
};
