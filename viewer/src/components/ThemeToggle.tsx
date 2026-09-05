import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle Theme"
      title={isDark ? 'Switch to Light Mode ☀️' : 'Switch to Dark Mode 🌙'}
      style={{
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
      } as React.CSSProperties}
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

      <div
        style={{
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
        } as React.CSSProperties}
      >
        {isDark ? <Moon size={12} color="#ffffff" /> : <Sun size={12} color="#ffffff" />}
      </div>
    </button>
  );
};
