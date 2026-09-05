import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit, Image as ImageIcon, Film, Layers, User, Shield } from 'lucide-react';
import { api } from '../api';
import { Show, Episode } from '../types';
import { ShowModal } from '../components/ShowModal';
import { EpisodeModal } from '../components/EpisodeModal';

interface ShowsPageProps {
  role: 'editor' | 'admin';
}

export const ShowsPage: React.FC<ShowsPageProps> = ({ role }) => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'shows' | 'episodes'>('shows');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  // Modals
  const [showModalOpen, setShowModalOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);

  const [episodeModalOpen, setEpisodeModalOpen] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

  // Queries using TanStack Query
  const { data: showsData, isLoading: showsLoading, refetch: refetchShows } = useQuery({
    queryKey: ['shows', sectionFilter, statusFilter, searchQuery, page],
    queryFn: () => api.getShows({
      section: sectionFilter || undefined,
      status: statusFilter || undefined,
      q: searchQuery || undefined,
      skip: (page - 1) * limit,
      limit
    })
  });

  const { data: episodesData, isLoading: episodesLoading, refetch: refetchEpisodes } = useQuery({
    queryKey: ['episodes', statusFilter, languageFilter, searchQuery, page],
    queryFn: () => api.getEpisodes({
      status: statusFilter || undefined,
      language: languageFilter || undefined,
      q: searchQuery || undefined,
      skip: (page - 1) * limit,
      limit
    })
  });

  const shows = showsData?.shows || [];
  const episodes = episodesData?.episodes || [];

  const handleOpenEditShow = async (s: Show) => {
    setSelectedShow(s);
    setShowModalOpen(true);
  };

  const handleOpenEditEpisode = (ep: Episode) => {
    setSelectedEpisode(ep);
    setEpisodeModalOpen(true);
  };

  return (
    <div className="page-content">
      {/* Role Context Banner */}
      {role === 'editor' ? (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '10px 16px',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.86rem',
          color: 'var(--text-main)'
        }}>
          <User size={16} color="#10b981" />
          <span>
            <strong>EDITOR WORKSPACE ACTIVE:</strong> Permission granted for full CRUD on Shows & Episodes, 3-slot artwork uploads, and content draft/published status editing.
          </span>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          padding: '10px 16px',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.86rem',
          color: 'var(--text-main)'
        }}>
          <Shield size={16} color="#6366f1" />
          <span>
            <strong>ADMIN WORKSPACE ACTIVE:</strong> Full system access active — Content management, validation auditing, and atomic catalogue publishing capabilities.
          </span>
        </div>
      )}

      <div className="page-title-bar">
        <div>
          <h1>Catalogue Content Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage shows, seasons, episodes, and artwork assets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn-secondary"
            onClick={() => {
              setSelectedShow(null);
              setShowModalOpen(true);
            }}
          >
            <Plus size={16} /> Add Show
          </button>

          <button
            className="btn-primary"
            onClick={() => {
              setSelectedEpisode(null);
              setEpisodeModalOpen(true);
            }}
          >
            <Plus size={16} /> Add Episode
          </button>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="controls-bar">
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn-secondary ${viewMode === 'shows' ? 'active' : ''}`}
            style={viewMode === 'shows' ? { backgroundColor: 'var(--accent-primary)', color: '#fff' } : {}}
            onClick={() => setViewMode('shows')}
          >
            <Film size={15} /> Shows ({showsData?.total || 0})
          </button>
          <button
            className={`btn-secondary ${viewMode === 'episodes' ? 'active' : ''}`}
            style={viewMode === 'episodes' ? { backgroundColor: 'var(--accent-primary)', color: '#fff' } : {}}
            onClick={() => setViewMode('episodes')}
          >
            <Layers size={15} /> Episodes ({episodesData?.total || 0})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-input-group">
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search title, slug, or content group..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          {viewMode === 'shows' ? (
            <select className="filter-select" value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
              <option value="">All Sections</option>
              <option value="featured">featured</option>
              <option value="series">series</option>
              <option value="minisodes">minisodes</option>
              <option value="songs">songs</option>
            </select>
          ) : (
            <select className="filter-select" value={languageFilter} onChange={e => setLanguageFilter(e.target.value)}>
              <option value="">All Languages</option>
              <option value="en">English (en)</option>
              <option value="hi">Hindi (hi)</option>
            </select>
          )}
        </div>
      </div>

      {/* Shows Table View */}
      {viewMode === 'shows' && (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title & Slug</th>
                <th>Section</th>
                <th>Categories</th>
                <th>Episodes</th>
                <th>Artwork Status</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {showsLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>Loading shows dataset...</td>
                </tr>
              ) : shows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No shows match your filter parameters.</td>
                </tr>
              ) : (
                shows.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{s.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.slug}</div>
                    </td>
                    <td>
                      {s.section ? (
                        <span className="badge badge-section">{s.section}</span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.8rem' }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {s.categories.slice(0, 3).map(c => (
                          <span key={c} style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{c}</span>
                        ))}
                      </div>
                    </td>
                    <td><strong>{s.episodes_count}</strong> episodes</td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: s.artworks.length >= 3 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                        <ImageIcon size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        {s.artworks.length} / 3 slots
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-secondary" onClick={() => handleOpenEditShow(s)}>
                        <Edit size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Episodes Table View */}
      {viewMode === 'episodes' && (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Episode Title</th>
                <th>Show Title</th>
                <th>Season & Ep</th>
                <th>Lang</th>
                <th>Content Group</th>
                <th>Duration</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {episodesLoading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px' }}>Loading episodes dataset...</td>
                </tr>
              ) : episodes.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No episodes match your filter parameters.</td>
                </tr>
              ) : (
                episodes.map(ep => (
                  <tr key={ep.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{ep.id}</td>
                    <td style={{ fontWeight: 600 }}>{ep.episode_title}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{ep.show_title}</td>
                    <td>
                      {ep.season_number === 0 ? (
                        <span className="badge" style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>S0 Trailer</span>
                      ) : (
                        `S${ep.season_number} E${ep.episode_number}`
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, textTransform: 'uppercase', color: ep.language === 'hi' ? '#f472b6' : '#38bdf8' }}>
                        {ep.language}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ep.content_group}</td>
                    <td>{ep.duration_seconds ? `${ep.duration_seconds}s` : <span style={{ color: 'var(--accent-danger)' }}>Missing</span>}</td>
                    <td>
                      <span className={`badge ${ep.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                        {ep.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-secondary" onClick={() => handleOpenEditEpisode(ep)}>
                        <Edit size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showModalOpen && (
        <ShowModal
          show={selectedShow}
          onClose={() => setShowModalOpen(false)}
          onSave={() => {
            refetchShows();
            queryClient.invalidateQueries({ queryKey: ['validation'] });
          }}
        />
      )}

      {episodeModalOpen && (
        <EpisodeModal
          episode={selectedEpisode}
          shows={shows}
          onClose={() => setEpisodeModalOpen(false)}
          onSave={() => {
            refetchEpisodes();
            refetchShows();
            queryClient.invalidateQueries({ queryKey: ['validation'] });
          }}
        />
      )}
    </div>
  );
};
