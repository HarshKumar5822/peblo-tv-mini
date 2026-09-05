import React from 'react';
import { Play, Heart, ExternalLink } from 'lucide-react';

interface FooterProps {
  onSelectSection?: (section: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectSection }) => {
  const handleSectionClick = (sec: string) => {
    if (onSelectSection) {
      onSelectSection(sec);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="viewer-footer">
      <div className="footer-content">
        <div>
          <div
            className="brand-logo"
            style={{ marginBottom: '8px', cursor: 'pointer' }}
            onClick={() => handleSectionClick('')}
          >
            <Play fill="#e50914" size={22} />
            PEBLO <span>TV</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', maxWidth: '400px' }}>
            Full-Stack Peblo TV Miniature Catalogue & Streaming Surface for Children. Built by Harsh Kumar for Full-Stack Platform Engineer Internship Project.
          </p>
        </div>

        <div className="footer-links-group">
          <div>
            <div className="footer-column-title">Sections</div>
            <div className="footer-column-links">
              <button className="footer-link-btn" onClick={() => handleSectionClick('featured')}>
                Featured Shows
              </button>
              <button className="footer-link-btn" onClick={() => handleSectionClick('series')}>
                Series
              </button>
              <button className="footer-link-btn" onClick={() => handleSectionClick('minisodes')}>
                Minisodes
              </button>
              <button className="footer-link-btn" onClick={() => handleSectionClick('songs')}>
                Songs & Singalongs
              </button>
            </div>
          </div>

          <div>
            <div className="footer-column-title">Platform</div>
            <div className="footer-column-links">
              <a href="http://localhost:3001" target="_blank" rel="noreferrer" className="footer-link-a">
                CMS Internal Studio <ExternalLink size={12} />
              </a>
              <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="footer-link-a">
                FastAPI Backend API <ExternalLink size={12} />
              </a>
              <a href="http://localhost:8000/health" target="_blank" rel="noreferrer" className="footer-link-a">
                PostgreSQL & Health <ExternalLink size={12} />
              </a>
              <a href="http://localhost:8000/catalog" target="_blank" rel="noreferrer" className="footer-link-a">
                Atomic Published JSON <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <span>© 2026 Peblo TV Mini. Crafted with</span>
        <Heart size={14} color="#e50914" fill="#e50914" />
        <span>by <strong style={{ color: 'var(--text-main)', fontWeight: 700 }}>Harsh Kumar</strong> | Full-Stack Platform Engineer</span>
      </div>
    </footer>
  );
};
