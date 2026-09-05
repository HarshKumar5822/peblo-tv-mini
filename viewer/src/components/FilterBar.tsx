import React from 'react';
import { Search } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
  languageFilter: string;
  setLanguageFilter: (lang: string) => void;
  isStandalone?: boolean;
}

const CATEGORIES = [
  'adventure', 'folk', 'friendship', 'india', 'language',
  'learning', 'maths', 'music', 'nature', 'reading',
  'science', 'singalong', 'stories', 'travel', 'values'
];

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  languageFilter,
  setLanguageFilter,
  isStandalone = false,
}) => {
  return (
    <div className={`filter-bar-container ${isStandalone ? 'standalone' : 'hero-overlap'}`}>
      <div className="search-box">
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Search show titles or categories..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="filter-pills">
        <select
          className="select-pill"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>

        <select
          className="select-pill"
          value={languageFilter}
          onChange={e => setLanguageFilter(e.target.value)}
        >
          <option value="">All Languages</option>
          <option value="en">English (EN)</option>
          <option value="hi">Hindi (HI)</option>
        </select>
      </div>
    </div>
  );
};
