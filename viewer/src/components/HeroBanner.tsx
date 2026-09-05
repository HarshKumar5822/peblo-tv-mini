import React, { useState } from 'react';
import { Play, Info, Sparkles } from 'lucide-react';
import { ShowCatalogueItem } from '../types';

interface HeroBannerProps {
  show: ShowCatalogueItem | null;
  onOpenDetail: (show: ShowCatalogueItem) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ show, onOpenDetail }) => {
  const [imgFailed, setImgFailed] = useState(false);
  if (!show) return null;

  const bannerUrl = (show.artwork.banner && !imgFailed)
    ? (show.artwork.banner.startsWith('http') ? show.artwork.banner : `http://localhost:8000${show.artwork.banner}`)
    : null;

  return (
    <div className="hero-container">
      {bannerUrl && (
        <img
          src={bannerUrl}
          alt={show.title}
          className="hero-backdrop"
          onError={() => setImgFailed(true)}
        />
      )}
      <div className="hero-gradient" />

      <div className="hero-content">
        <div className="hero-badge">
          <Sparkles size={13} />
          {show.section ? show.section.toUpperCase() : 'FEATURED SHOW'}
        </div>

        <h1 className="hero-title">{show.title}</h1>

        <p className="hero-synopsis">{show.synopsis || 'Explore episodes and trailers.'}</p>

        <div className="hero-actions">
          <button className="btn-play" onClick={() => onOpenDetail(show)}>
            <Play fill="#000" size={18} /> Watch Now
          </button>
          <button className="btn-info" onClick={() => onOpenDetail(show)}>
            <Info size={18} /> More Info
          </button>
        </div>
      </div>
    </div>
  );
};
