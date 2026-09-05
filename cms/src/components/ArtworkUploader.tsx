import React, { useState } from 'react';
import { Upload, Image as ImageIcon, AlertTriangle, Check } from 'lucide-react';
import { api } from '../api';

interface ArtworkUploaderProps {
  entityType: 'show' | 'episode';
  entityId: string;
  existingArtworks?: Record<string, string>; // type -> file_path
  onUploadSuccess?: () => void;
}

const ARTWORK_SPECS = [
  { type: 'poster' as const, label: 'Poster Artwork', aspect: '2:3', target: '~600×900 px', maxKb: '200 KB' },
  { type: 'banner' as const, label: 'Banner Artwork', aspect: '16:9', target: '~1280×720 px', maxKb: '200 KB' },
  { type: 'thumbnail' as const, label: 'Thumbnail Artwork', aspect: '16:9', target: '~640×360 px', maxKb: '200 KB' },
];

export const ArtworkUploader: React.FC<ArtworkUploaderProps> = ({
  entityType,
  entityId,
  existingArtworks = {},
  onUploadSuccess
}) => {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previews, setPreviews] = useState<Record<string, string>>(existingArtworks);

  const handleFileChange = async (artworkType: 'poster' | 'banner' | 'thumbnail', file: File) => {
    setUploading(prev => ({ ...prev, [artworkType]: true }));
    setErrors(prev => ({ ...prev, [artworkType]: '' }));

    // Instant local preview
    const localPreviewUrl = URL.createObjectURL(file);
    setPreviews(prev => ({ ...prev, [artworkType]: localPreviewUrl }));

    try {
      const result = await api.uploadArtwork(entityType, entityId, artworkType, file);
      setPreviews(prev => ({ ...prev, [artworkType]: `http://localhost:8000${result.file_path}` }));
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [artworkType]: err.message || 'Upload failed' }));
    } finally {
      setUploading(prev => ({ ...prev, [artworkType]: false }));
    }
  };

  return (
    <div style={{ marginTop: '16px' }}>
      <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>
        Artwork Upload Slots (Aspect & File Size Strictly Enforced)
      </label>

      <div className="artwork-grid">
        {ARTWORK_SPECS.map(spec => {
          const isUploading = uploading[spec.type];
          const errorMsg = errors[spec.type];
          const currentUrl = previews[spec.type] || existingArtworks[spec.type];
          const fullUrl = currentUrl ? (currentUrl.startsWith('http') || currentUrl.startsWith('blob') ? currentUrl : `http://localhost:8000${currentUrl}`) : null;

          return (
            <div className="artwork-card" key={spec.type}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>{spec.label}</div>
              <div className="artwork-spec-pill">{spec.aspect} • {spec.target} • max {spec.maxKb}</div>

              {fullUrl ? (
                <img src={fullUrl} alt={spec.label} className="artwork-preview" />
              ) : (
                <div className="artwork-preview" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                  <ImageIcon size={28} />
                  <span style={{ fontSize: '0.75rem', marginTop: '4px' }}>No Image Uploaded</span>
                </div>
              )}

              <label className="btn-secondary" style={{ width: '100%', justifyContent: 'center', cursor: 'pointer', fontSize: '0.8rem' }}>
                <Upload size={14} />
                {isUploading ? 'Uploading...' : fullUrl ? 'Replace Image' : 'Upload Image'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  disabled={isUploading}
                  onChange={e => {
                    if (e.target.files?.[0]) {
                      handleFileChange(spec.type, e.target.files[0]);
                    }
                  }}
                />
              </label>

              {errorMsg && (
                <div className="artwork-error-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <AlertTriangle size={14} />
                    Validation Rejected:
                  </div>
                  <div style={{ marginTop: '2px', fontSize: '0.75rem' }}>{errorMsg}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
