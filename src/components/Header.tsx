import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, RefreshCw, X, Radio, Sparkles, AlertCircle } from 'lucide-react';
import { ActiveTab, RealtimeExchangeRate } from '../types';
import { CURRENCIES } from '../data/currencies';
import { fetchRealtimeExchangeRate } from '../services/ratesService';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectPair?: (from: string, to: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onSelectPair,
}) => {
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [liveSearchResult, setLiveSearchResult] = useState<RealtimeExchangeRate | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse input into potential from / to currency
  const parseSearchPair = (input: string): { from: string; to: string } | null => {
    const clean = input.trim().toUpperCase();
    if (!clean) return null;

    // Pattern 1: USD/SGD, USD-SGD, USD_SGD
    const splitMatch = clean.match(/^([A-Z]{3})[\s/\-_]+([A-Z]{3})$/);
    if (splitMatch) {
      return { from: splitMatch[1], to: splitMatch[2] };
    }

    // Pattern 2: USD TO SGD, USD IN SGD
    const toMatch = clean.match(/^([A-Z]{3})\s+(?:TO|IN)\s+([A-Z]{3})$/);
    if (toMatch) {
      return { from: toMatch[1], to: toMatch[2] };
    }

    // Pattern 3: Single 3-letter currency code (e.g. SGD -> pair with USD)
    if (/^[A-Z]{3}$/.test(clean)) {
      if (clean === 'USD') return { from: 'USD', to: 'SGD' };
      return { from: 'USD', to: clean };
    }

    // Pattern 4: Search currency by name (e.g. "Singapore", "Euro", "Yen")
    const foundCurrency = Object.values(CURRENCIES).find(
      (c) =>
        c.name.toLowerCase().includes(input.toLowerCase()) ||
        c.countryCode.toLowerCase().includes(input.toLowerCase())
    );
    if (foundCurrency) {
      const code = foundCurrency.code;
      if (code === 'USD') return { from: 'USD', to: 'SGD' };
      return { from: 'USD', to: code };
    }

    return null;
  };

  // Debounced search trigger for Alpha Vantage API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setLiveSearchResult(null);
      setSearchError(null);
      setShowDropdown(false);
      return;
    }

    const pair = parseSearchPair(searchQuery);
    if (!pair) {
      setLiveSearchResult(null);
      setSearchError(null);
      return;
    }

    setShowDropdown(true);
    setIsSearchingLive(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const data = await fetchRealtimeExchangeRate(pair.from, pair.to, true);
        setLiveSearchResult(data);
        if (data.apiStatus === 'ERROR' && data.errorMessage) {
          setSearchError(data.errorMessage);
        }
      } catch (err: any) {
        setSearchError(err?.message || 'Failed to connect to Alpha Vantage API');
      } finally {
        setIsSearchingLive(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (from: string, to: string) => {
    if (onSelectPair) {
      onSelectPair(from, to);
    }
    setShowDropdown(false);
    onSearchChange('');
    onTabChange('convert');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const pair = parseSearchPair(searchQuery);
      if (pair) {
        handleSelectResult(pair.from, pair.to);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Global Currency Search */}
        <div className="flex items-center gap-4 lg:gap-8 flex-1">
          <button
            id="btn-brand-logo"
            onClick={() => onTabChange('convert')}
            className="flex items-center text-2xl font-black tracking-tight text-[#0a2540] hover:opacity-90 transition-opacity cursor-pointer shrink-0"
          >
            Global<span className="text-[#0a2540]">FX</span>
          </button>

          {/* Search bar with real-time Alpha Vantage API integration */}
          <div ref={dropdownRef} className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="header-search-input"
              type="text"
              value={searchQuery}
              onFocus={() => {
                if (searchQuery.trim()) setShowDropdown(true);
              }}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search currency or pair (e.g. USD SGD, EUR/USD)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-14 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 transition-all"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    setLiveSearchResult(null);
                    setShowDropdown(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  const pair = parseSearchPair(searchQuery);
                  if (pair) {
                    setIsSearchingLive(true);
                    setShowDropdown(true);
                    fetchRealtimeExchangeRate(pair.from, pair.to, true)
                      .then((data) => setLiveSearchResult(data))
                      .catch(() => setSearchError('Failed to fetch rate'))
                      .finally(() => setIsSearchingLive(false));
                  }
                }}
                title="Execute Alpha Vantage API query"
                className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-md text-[10px] font-bold px-1.5 transition-colors cursor-pointer"
              >
                Go
              </button>
            </div>

            {/* Live Search Results Popover */}
            {showDropdown && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
                    <span>Alpha Vantage CURRENCY_EXCHANGE_RATE</span>
                  </span>
                  {isSearchingLive && (
                    <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
                  )}
                </div>

                {isSearchingLive && !liveSearchResult ? (
                  <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Querying Alpha Vantage API endpoint...</span>
                  </div>
                ) : liveSearchResult ? (
                  <div className="p-3 space-y-2">
                    <div
                      onClick={() => handleSelectResult(liveSearchResult.from, liveSearchResult.to)}
                      className="p-2.5 rounded-lg hover:bg-blue-50/70 border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer bg-slate-50/30"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-base">
                              {liveSearchResult.from} / {liveSearchResult.to}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                liveSearchResult.isLive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {liveSearchResult.isLive ? 'Live API Feed' : 'Rate Limited / Quota'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {liveSearchResult.fromName || liveSearchResult.from} to{' '}
                            {liveSearchResult.toName || liveSearchResult.to}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-blue-700 text-lg tracking-tight">
                            {liveSearchResult.exchangeRate.toFixed(
                              liveSearchResult.to === 'JPY' ? 2 : 4
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Bid: {liveSearchResult.bidPrice.toFixed(4)} | Ask:{' '}
                            {liveSearchResult.askPrice.toFixed(4)}
                          </p>
                        </div>
                      </div>

                      {liveSearchResult.requestedUrl && (
                        <div className="mt-2 text-[10px] font-mono text-slate-600 bg-slate-100 p-2 rounded border border-slate-200 break-all select-all">
                          <span className="font-sans font-bold text-slate-500 uppercase mr-1">API URL:</span>
                          {liveSearchResult.requestedUrl}
                        </div>
                      )}

                      {liveSearchResult.apiMessage && (
                        <div className="mt-1 text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200">
                          {liveSearchResult.apiMessage}
                        </div>
                      )}

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Refreshed: {liveSearchResult.lastRefreshed}</span>
                        <span className="flex items-center gap-1 font-semibold text-blue-600">
                          Load Into Converter <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                ) : searchError ? (
                  <div className="p-3 bg-rose-50/60 border-t border-rose-100 text-xs">
                    <div className="flex items-start gap-2 text-rose-700 font-semibold mb-1">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>API Call Error</span>
                    </div>
                    <p className="text-rose-600 font-mono text-[11px] bg-white p-2 rounded border border-rose-200 break-all select-all">
                      {searchError}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400">
                    Press Enter or click "Go" to look up live rate from Alpha Vantage.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right / Center: Navigation Tabs */}
        <nav className="flex items-center space-x-2 sm:space-x-6 lg:space-x-8 h-full shrink-0">
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
