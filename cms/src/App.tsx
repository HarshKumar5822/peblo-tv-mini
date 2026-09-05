import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/Navbar';
import { ShowsPage } from './pages/ShowsPage';
import { ValidationPage } from './pages/ValidationPage';
import { HistoryPage } from './pages/HistoryPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'shows' | 'publish' | 'history'>('shows');
  const [role, setRole] = useState<'editor' | 'admin'>('admin');

  // Theme State ('dark' | 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('peblo_cms_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('peblo_cms_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-container">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          role={role}
          setRole={setRole}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main style={{ flex: 1 }}>
          {activeTab === 'shows' && <ShowsPage role={role} />}
          {activeTab === 'publish' && <ValidationPage role={role} setRole={setRole} />}
          {activeTab === 'history' && <HistoryPage role={role} />}
        </main>
      </div>
    </QueryClientProvider>
  );
};

export default App;
