import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Show } from '../types';
import { api } from '../api';
import { ArtworkUploader } from './ArtworkUploader';

interface ShowModalProps {
  show?: Show | null;
  onClose: () => void;
  onSave: () => void;
}

export const ShowModal: React.FC<ShowModalProps> = ({ show, onClose, onSave }) => {
  const isEdit = !!show;

  const [title, setTitle] = useState(show?.title || '');
  const [slug, setSlug] = useState(show?.slug || '');
  const [section, setSection] = useState(show?.section || '');
  const [synopsis, setSynopsis] = useState(show?.synopsis || '');
  const [categoriesText, setCategoriesText] = useState(show?.categories?.join(', ') || '');
  const [status, setStatus] = useState<'draft' | 'published'>(show?.status || 'draft');

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

    const categories = categoriesText.split(',').map(c => c.trim()).filter(Boolean);

    try {
      if (isEdit && show) {
        await api.updateShow(show.id, {
          title,
          section: section || null,
          synopsis,
          categories,
          status
        });
      } else {
        await api.createShow({
          title,
          slug,
          section: section || null,
          synopsis,
          categories,
          status
        });
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save show');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? `Edit Show: ${show.title}` : 'Create New Show'}</h3>
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
              <div className="form-group">
                <label>Show Title *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={title}
                  onChange={e => {
                    setTitle(e.target.value);
                    if (!isEdit) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }}
                  placeholder="e.g. Moti's Many Lives"
                />
              </div>

              <div className="form-group">
                <label>Slug Identifier *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  disabled={isEdit}
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="e.g. motis-many-lives"
                />
              </div>

              <div className="form-group">
                <label>Section Assignment</label>
                <select className="form-control" value={section} onChange={e => setSection(e.target.value)}>
                  <option value="">-- None (Draft Only) --</option>
                  <option value="featured">featured</option>
                  <option value="series">series</option>
                  <option value="minisodes">minisodes</option>
                  <option value="songs">songs</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={status} onChange={e => setStatus(e.target.value as any)}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Categories (Comma separated)</label>
                <input
                  type="text"
                  className="form-control"
                  value={categoriesText}
                  onChange={e => setCategoriesText(e.target.value)}
                  placeholder="e.g. adventure, india, friendship"
                />
              </div>

              <div className="form-group full-width">
                <label>Synopsis</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={synopsis}
                  onChange={e => setSynopsis(e.target.value)}
                  placeholder="Provide brief show description..."
                />
              </div>
            </div>

            {isEdit && show && (
              <ArtworkUploader
                entityType="show"
                entityId={show.slug}
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
              {saving ? 'Saving...' : 'Save Show'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
