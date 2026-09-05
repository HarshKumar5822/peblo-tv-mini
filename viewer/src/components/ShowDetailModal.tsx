import React, { useState, useEffect } from 'react';
import { X, Play, Clock, Sparkles, Languages, Film, Globe } from 'lucide-react';
import { ShowCatalogueItem, CollapsedEpisode } from '../types';

interface ShowDetailModalProps {
  show: ShowCatalogueItem;
  onClose: () => void;
}

const EpisodeThumbnail: React.FC<{ src: string | null; alt: string }> = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="episode-thumb" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '6px', textAlign: 'center' }}>
        <Play size={20} color="var(--accent-red)" />
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="episode-thumb"
      onError={() => setFailed(true)}
    />
  );
};

export const ShowDetailModal: React.FC<ShowDetailModalProps> = ({ show, onClose }) => {
  const hasTrailers = show.trailers && show.trailers.length > 0;
  const hasNormalSeasons = show.seasons && show.seasons.length > 0;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Active season selector: 'trailers' if season 0, or season number (1, 2...)
  const defaultSeason = hasNormalSeasons ? show.seasons[0].season_number : 'trailers';
  const [activeSeason, setActiveSeason] = useState<number | 'trailers'>(defaultSeason);

  // Per-episode selected language state: content_group -> lang ('en' | 'hi')
  const [selectedLangs, setSelectedLangs] = useState<Record<string, string>>({});

  const getActiveLang = (ep: CollapsedEpisode) => {
    return selectedLangs[ep.content_group] || ep.languages[0] || 'en';
  };

  const handleLangToggle = (cg: string, lang: string) => {
    setSelectedLangs(prev => ({ ...prev, [cg]: lang }));
  };

  const [bannerFailed, setBannerFailed] = useState(false);
  const bannerUrl = (show.artwork.banner && !bannerFailed)
    ? (show.artwork.banner.startsWith('http') ? show.artwork.banner : `http://localhost:8000${show.artwork.banner}`)
    : null;

  // Get active episode list based on season selection
  let currentEpisodes: CollapsedEpisode[] = [];
  if (activeSeason === 'trailers') {
    currentEpisodes = show.trailers;
  } else {
    const sObj = show.seasons.find(s => s.season_number === activeSeason);
    currentEpisodes = sObj ? sObj.episodes : [];
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="viewer-modal-card" onClick={e => e.stopPropagation()}>
        <button className="viewer-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Modal Banner */}
        <div className="viewer-modal-hero">
          {bannerUrl ? (
            <img src={bannerUrl} alt={show.title} onError={() => setBannerFailed(true)} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e293b, #0b0f19)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Film size={60} color="var(--text-dim)" />
            </div>
          )}
          <div className="hero-gradient" />
          <div style={{ position: 'absolute', bottom: '24px', left: '32px', right: '32px', zIndex: 5 }}>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{show.title}</h2>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="viewer-modal-body">
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
            <span className="badge badge-published" style={{ textTransform: 'uppercase' }}>
              {show.section || 'Featured'}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {show.total_episodes} Episodes Available
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {show.categories.map(c => (
                <span key={c} style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem' }}>
                  {c}
                </span>
              ))}
            </div>
          </div>

          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
            {show.synopsis || 'No synopsis available.'}
          </p>

          {/* Season Selector Tabs */}
          <div className="season-tabs">
            {hasTrailers && (
              <button
                className={`season-tab trailer-tab ${activeSeason === 'trailers' ? 'active' : ''}`}
                onClick={() => setActiveSeason('trailers')}
              >
                <Sparkles size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Trailers & Teasers (Season 0)
              </button>
            )}

            {show.seasons.map(s => (
              <button
                key={s.season_number}
                className={`season-tab ${activeSeason === s.season_number ? 'active' : ''}`}
                onClick={() => setActiveSeason(s.season_number)}
              >
                Season {s.season_number}
              </button>
            ))}
          </div>

          {/* Episode List */}
          <div className="episode-card-list">
            {currentEpisodes.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No episodes available in this season.
              </div>
            ) : (
              currentEpisodes.map((ep, idx) => {
                const activeLang = getActiveLang(ep);
                const variant = ep.variants[activeLang] || Object.values(ep.variants)[0];
                const thumbUrl = ep.artwork.thumbnail ? (ep.artwork.thumbnail.startsWith('http') ? ep.artwork.thumbnail : `http://localhost:8000${ep.artwork.thumbnail}`) : null;

                const hasMultipleLangs = ep.languages.length > 1;

                return (
                  <div key={ep.content_group} className="episode-row-card">
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-dim)', width: '30px', textAlign: 'center' }}>
                      {idx + 1}
                    </div>

                    <EpisodeThumbnail src={thumbUrl} alt={variant ? variant.episode_title : ep.default_title} />

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                          {variant ? variant.episode_title : ep.default_title}
                        </div>

                        {/* Language Selection / Display */}
                        {hasMultipleLangs ? (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '3px 8px', borderRadius: '6px' }}>
                            <Globe size={13} color="var(--accent-red)" style={{ marginRight: '2px' }} />
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '4px' }}>Audio:</span>
                            {ep.languages.map(lang => (
                              <button
                                key={lang}
                                className={`lang-pill ${activeLang === lang ? 'active' : ''}`}
                                onClick={() => handleLangToggle(ep.content_group, lang)}
                                title={`Switch audio to ${lang.toUpperCase()}`}
                              >
                                {lang.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <Globe size={12} />
                            <span>{ep.languages[0]?.toUpperCase() || 'EN'}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} />
                          {variant?.duration_seconds ? `${Math.round(variant.duration_seconds / 60)} min` : 'Duration N/A'}
                        </span>
                        <span>Group: {ep.content_group}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
