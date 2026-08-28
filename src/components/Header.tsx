import React from 'react';
import { Search } from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
}) => {
  const showSearchBar = activeTab === 'market_rates' || activeTab === 'favorite_pairs';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Search */}
        <div className="flex items-center gap-6 lg:gap-8">
          <button
            id="btn-brand-logo"
            onClick={() => onTabChange('convert')}
            className="flex items-center text-2xl font-black tracking-tight text-[#0a2540] hover:opacity-90 transition-opacity cursor-pointer"
          >
            Global<span className="text-[#0a2540]">FX</span>
          </button>

          {showSearchBar && (
            <div className="relative hidden md:block w-56 lg:w-72 transition-all">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="header-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={activeTab === 'market_rates' ? 'Search pairs...' : 'Search currencies...'}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right / Center: Navigation Tabs */}
        <nav className="flex items-center space-x-2 sm:space-x-6 lg:space-x-8 h-full">
          <button
            id="nav-tab-convert"
            onClick={() => onTabChange('convert')}
            className={`h-full flex items-center px-2 sm:px-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'convert'
                ? 'border-[#0a2540] text-[#0a2540] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Convert
          </button>

          <button
            id="nav-tab-market-rates"
            onClick={() => onTabChange('market_rates')}
            className={`h-full flex items-center px-2 sm:px-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'market_rates'
                ? 'border-[#0a2540] text-[#0a2540] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Market Rates
          </button>

          <button
            id="nav-tab-favorite-pairs"
            onClick={() => onTabChange('favorite_pairs')}
            className={`h-full flex items-center px-2 sm:px-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'favorite_pairs'
                ? 'border-[#0a2540] text-[#0a2540] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Favorite Pairs
          </button>
        </nav>
      </div>
    </header>
  );
};
