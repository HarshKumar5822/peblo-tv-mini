import React, { useState } from 'react';
import { Film } from 'lucide-react';
import { ShowCatalogueItem } from '../types';

interface ShowCardProps {
  show: ShowCatalogueItem;
  onClick: (show: ShowCatalogueItem) => void;
}

export const ShowCard: React.FC<ShowCardProps> = ({ show, onClick }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const posterUrl = (show.artwork.poster && !imgFailed)
    ? (show.artwork.poster.startsWith('http') ? show.artwork.poster : `http://localhost:8000${show.artwork.poster}`)
    : null;

  return (
    <div className="show-card" onClick={() => onClick(show)}>
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={show.title}
          className="show-card-poster"
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="show-card-fallback">
          <Film size={36} color="var(--text-dim)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '8px' }}>{show.title}</span>
        </div>
      )}

      <div className="show-card-overlay">
        <div className="show-card-title">{show.title}</div>
        <div className="show-card-meta">
          <span>{show.categories[0] || 'Show'}</span>
          <span>{show.total_episodes} Ep</span>
        </div>
      </div>
    </div>
  );
};
