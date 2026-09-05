import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ShowCatalogueItem } from '../types';
import { ShowCard } from './ShowCard';

interface SectionRowProps {
  title: string;
  shows: ShowCatalogueItem[];
  onSelectShow: (show: ShowCatalogueItem) => void;
}

export const SectionRow: React.FC<SectionRowProps> = ({ title, shows, onSelectShow }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!shows || shows.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = direction === 'left' ? -450 : 450;
      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="section-row">
      <div className="row-header">
        <h2 className="row-title">{title}</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {shows.length} shows
        </span>
      </div>

      <div className="carousel-wrapper">
        <button
          className="scroll-arrow-btn left"
          onClick={() => scroll('left')}
          title="Scroll Left"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="row-cards-container" ref={containerRef}>
          {shows.map((show) => (
            <ShowCard key={show.id} show={show} onClick={onSelectShow} />
          ))}
        </div>

        <button
          className="scroll-arrow-btn right"
          onClick={() => scroll('right')}
          title="Scroll Right"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};
