import React from 'react';
import { Play } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  activeSection: string;
  onSelectSection: (section: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onSelectSection,
  theme,
  onToggleTheme,
}) => {
  const navItems = [
    { id: '', label: 'Home' },
    { id: 'featured', label: 'Featured' },
    { id: 'series', label: 'Series' },
    { id: 'minisodes', label: 'Minisodes' },
    { id: 'songs', label: 'Songs' },
  ];

  return (
    <header className="viewer-header scrolled">
      <a
        href="#"
        className="brand-logo"
        onClick={(e) => {
          e.preventDefault();
          onSelectSection('');
        }}
      >
        <Play fill="#e50914" size={24} />
        PEBLO <span>TV</span>
      </a>

      <nav style={{ display: 'flex', gap: '24px', fontSize: '0.9rem', alignItems: 'center' }}>
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                padding: '4px 0',
                borderBottom: isActive ? '2px solid var(--accent-red)' : '2px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
    </header>
  );
};
