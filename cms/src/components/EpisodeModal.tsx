import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Episode, Show } from '../types';
import { api } from '../api';
import { ArtworkUploader } from './ArtworkUploader';

interface EpisodeModalProps {
  episode?: Episode | null;
  shows: Show[];
  onClose: () => void;
  onSave: () => void;
}

export const EpisodeModal: React.FC<EpisodeModalProps> = ({ episode, shows, onClose, onSave }) => {
  const isEdit = !!episode;

  const [showId, setShowId] = useState<number>(episode?.show_id || (shows[0]?.id || 0));
  const [seasonNumber, setSeasonNumber] = useState<number>(episode?.season_number ?? 1);
  const [episodeNumber, setEpisodeNumber] = useState<number>(episode?.episode_number ?? 1);
  const [episodeTitle, setEpisodeTitle] = useState<string>(episode?.episode_title || '');
  const [durationSeconds, setDurationSeconds] = useState<string>(episode?.duration_seconds ? String(episode.duration_seconds) : '');
  const [language, setLanguage] = useState<string>(episode?.language || 'en');
  const [contentGroup, setContentGroup] = useState<string>(episode?.content_group || '');
  const [status, setStatus] = useState<'draft' | 'published'>(episode?.status || 'draft');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const dur = durationSeconds ? parseInt(durationSeconds, 10) : null;

    try {
      if (isEdit && episode) {
        await api.updateEpisode(episode.id, {
          season_number: seasonNumber,
          episode_number: episodeNumber,
          episode_title: episodeTitle,
          duration_seconds: dur,
          language,
          content_group: contentGroup,
          status
        });
      } else {
        await api.createEpisode({
          show_id: showId,
          season_number: seasonNumber,
          episode_number: episodeNumber,
          episode_title: episodeTitle,
          duration_seconds: dur,
          language,
          content_group: contentGroup,
          status
        });
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save episode');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? `Edit Episode: ${episode.id}` : 'Create New Episode'}</h3>
          <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="modal-body">
            {error && (
              <div className="artwork-error-banner" style={{ marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <div className="form-grid">
              <div className="form-group full-width">
                <label>Parent Show *</label>
                <select
                  className="form-control"
                  disabled={isEdit}
                  value={showId}
                  onChange={e => setShowId(parseInt(e.target.value, 10))}
                >
                  {shows.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Season Number * (0 = Trailer)</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  required
                  value={seasonNumber}
                  onChange={e => setSeasonNumber(parseInt(e.target.value, 10))}
                />
              </div>

              <div className="form-group">
                <label>Episode Number *</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  required
                  value={episodeNumber}
                  onChange={e => setEpisodeNumber(parseInt(e.target.value, 10))}
                />
              </div>

              <div className="form-group full-width">
                <label>Episode Title *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={episodeTitle}
                  onChange={e => setEpisodeTitle(e.target.value)}
                  placeholder="e.g. The Lost Kite"
                />
              </div>

              <div className="form-group">
                <label>Duration (Seconds)</label>
                <input
                  type="number"
                  className="form-control"
                  value={durationSeconds}
                  onChange={e => setDurationSeconds(e.target.value)}
                  placeholder="e.g. 510"
                />
              </div>

              <div className="form-group">
                <label>Language *</label>
                <select className="form-control" value={language} onChange={e => setLanguage(e.target.value)}>
                  <option value="en">English (en)</option>
                  <option value="hi">Hindi (hi)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Content Group Slug *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={contentGroup}
                  onChange={e => setContentGroup(e.target.value)}
                  placeholder="e.g. motis-many-lives-s01e01"
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={status} onChange={e => setStatus(e.target.value as any)}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            {isEdit && episode && (
              <ArtworkUploader
                entityType="episode"
                entityId={episode.id}
                onUploadSuccess={() => {}}
              />
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Episode'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
