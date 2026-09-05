import React from 'react';
import { Film, CheckCircle2, History, Shield, User, Sun, Moon } from 'lucide-react';
import { setApiRole } from '../api';

interface NavbarProps {
  activeTab: 'shows' | 'publish' | 'history';
  setActiveTab: (tab: 'shows' | 'publish' | 'history') => void;
  role: 'editor' | 'admin';
  setRole: (role: 'editor' | 'admin') => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  role,
  setRole,
  theme,
  onToggleTheme,
}) => {
  const isDark = theme === 'dark';

  const toggleContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '64px',
    height: '32px',
    borderRadius: '20px',
    background: isDark
      ? 'linear-gradient(135deg, #0f172a, #1e293b)'
      : 'linear-gradient(135deg, #e2e8f0, #ffffff)',
    border: isDark
      ? '1px solid rgba(99, 102, 241, 0.4)'
      : '1px solid rgba(245, 158, 11, 0.5)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 7px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isDark
      ? '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
      : '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
    outline: 'none',
    WebkitAppearance: 'none',
  } as React.CSSProperties;

  const knobStyle: React.CSSProperties = {
    position: 'absolute',
    top: '3px',
    left: '3px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: isDark
      ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
      : 'linear-gradient(135deg, #fbbf24, #d97706)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: isDark ? 'translateX(32px)' : 'translateX(0px)',
    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease',
    boxShadow: isDark
      ? '0 0 12px rgba(99, 102, 241, 0.8)'
      : '0 0 12px rgba(245, 158, 11, 0.8)',
    zIndex: 2,
  } as React.CSSProperties;

  return (
    <header className="main-header">
      <div className="header-brand">
        <div className="logo-icon">🎬</div>
        <span>Peblo TV Studio</span>
      </div>

      <nav className="nav-links">
        <button
          className={`nav-button ${activeTab === 'shows' ? 'active' : ''}`}
          onClick={() => setActiveTab('shows')}
        >
          <Film size={16} />
          Shows & Episodes
        </button>
        <button
          className={`nav-button ${activeTab === 'publish' ? 'active' : ''}`}
          onClick={() => setActiveTab('publish')}
        >
          <CheckCircle2 size={16} />
          Publish Catalogue
        </button>
        <button
          className={`nav-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} />
          Run History
        </button>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Toggle Dark/Light Theme"
          title={isDark ? 'Switch to Light Mode ☀️' : 'Switch to Dark Mode 🌙'}
          style={toggleContainerStyle}
        >
          <Sun
            size={13}
            color={isDark ? '#64748b' : '#f59e0b'}
            style={{ opacity: isDark ? 0.35 : 1, transition: 'opacity 0.2s ease', zIndex: 1 }}
          />
          <Moon
            size={13}
            color={isDark ? '#818cf8' : '#94a3b8'}
            style={{ opacity: isDark ? 1 : 0.35, transition: 'opacity 0.2s ease', zIndex: 1 }}
          />

          <div style={knobStyle}>
            {isDark ? <Moon size={12} color="#ffffff" /> : <Sun size={12} color="#ffffff" />}
          </div>
        </button>

        <div className="role-segmented-control">
          <span className="role-label">Role:</span>
          <div className="role-buttons">
            <button
              type="button"
              className={`role-seg-btn ${role === 'editor' ? 'active editor' : ''}`}
              onClick={() => {
                if (role !== 'editor') {
                  setApiRole('editor');
                  setRole('editor');
                }
              }}
              title="Switch to Editor Role"
            >
              <User size={13} />
              Editor
            </button>
            <button
              type="button"
              className={`role-seg-btn ${role === 'admin' ? 'active admin' : ''}`}
              onClick={() => {
                if (role !== 'admin') {
                  setApiRole('admin');
                  setRole('admin');
                }
              }}
              title="Switch to Admin Role"
            >
              <Shield size={13} />
              Admin
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
