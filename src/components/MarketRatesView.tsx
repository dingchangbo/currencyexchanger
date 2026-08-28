import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Minus, SlidersHorizontal, ArrowRight, Star, RefreshCw, Radio } from 'lucide-react';
import { INITIAL_MARKET_RATES } from '../data/currencies';
import { MarketRate } from '../types';
import { fetchAllMarketRates } from '../services/ratesService';

interface MarketRatesViewProps {
  searchQuery: string;
  onQuickTrade: (base: string, quote: string) => void;
  onAddToFavorites?: (base: string, quote: string) => void;
}

export const MarketRatesView: React.FC<MarketRatesViewProps> = ({
  searchQuery,
  onQuickTrade,
  onAddToFavorites,
}) => {
  const [rates, setRates] = useState<MarketRate[]>(INITIAL_MARKET_RATES);
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Majors' | 'Minors'>('All');
  const [showAllPairs, setShowAllPairs] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'gainers' | 'losers' | 'volatility'>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [feedSource, setFeedSource] = useState('Alpha Vantage Gateway');

  const loadRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllMarketRates();
      if (data.rates && data.rates.length > 0) {
        setRates(data.rates);
        setFeedSource(data.source);
      }
    } catch (err) {
      console.error('Failed to load market rates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadRates();
  }, [loadRates]);

  // Periodic polling for live real-time interbank quotes
  useEffect(() => {
    const interval = setInterval(() => {
      loadRates();
    }, 15000);

    return () => clearInterval(interval);
  }, [loadRates]);

  // Filter pairs
  let filteredRates = rates.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.pairName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.base.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.quote.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'All' ||
      (categoryFilter === 'Majors' && r.category === 'Majors') ||
      (categoryFilter === 'Minors' && (r.category === 'Minors' || r.category === 'Exotics'));

    return matchesSearch && matchesCategory;
  });

  if (sortBy === 'gainers') {
    filteredRates = [...filteredRates].sort((a, b) => b.change24h - a.change24h);
  } else if (sortBy === 'losers') {
    filteredRates = [...filteredRates].sort((a, b) => a.change24h - b.change24h);
  }

  // Display limited or all pairs
  const displayedRates = showAllPairs ? filteredRates : filteredRates.slice(0, 4);

  // SVG Sparkline Renderer
  const renderSparkline = (data: number[], change: number) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 160;
    const height = 44;

    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 10) - 5;
        return `${x},${y}`;
      })
      .join(' ');

    const strokeColor =
      change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#94a3b8';

    return (
      <svg
        className="w-full h-12 overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold mb-2">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            <span>{feedSource}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0a2540] tracking-tight">
            Market Rates
          </h1>
          <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
            <span>Live institutional interbank quotes with real-time bid/ask spreads.</span>
            <button
              onClick={loadRates}
              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer ml-1"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center gap-3 self-start lg:self-auto">
          {/* Segmented Control */}
          <div className="bg-[#e2e8f0]/80 p-1 rounded-lg flex items-center text-xs font-semibold text-slate-700">
            {(['All', 'Majors', 'Minors'] as const).map((cat) => (
              <button
                key={cat}
                id={`filter-cat-${cat.toLowerCase()}`}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-1.5 rounded-md transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Filter button with popover */}
          <div className="relative">
            <button
              id="btn-market-rates-filter"
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            </button>

            {showFilterDrawer && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl p-3 z-30 space-y-2 text-xs">
                <p className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                  Sort By
                </p>
                <button
                  onClick={() => {
                    setSortBy('default');
                    setShowFilterDrawer(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg cursor-pointer ${
                    sortBy === 'default' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50'
                  }`}
                >
                  Standard Default
                </button>
                <button
                  onClick={() => {
                    setSortBy('gainers');
                    setShowFilterDrawer(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg cursor-pointer ${
                    sortBy === 'gainers' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50'
                  }`}
                >
                  Top Gainers (24h)
                </button>
                <button
                  onClick={() => {
                    setSortBy('losers');
                    setShowFilterDrawer(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg cursor-pointer ${
                    sortBy === 'losers' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50'
                  }`}
                >
                  Top Decliners (24h)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Rate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {displayedRates.map((rate) => {
          const isPositive = rate.change24h > 0;
          const isNegative = rate.change24h < 0;

          return (
            <div
              key={rate.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between group hover:border-slate-300 relative"
            >
              <div>
                {/* Header: Pair Name + Badge */}
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    {rate.base}/{rate.quote}
                  </h3>

                  {/* Percentage Change Badge */}
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isPositive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : isNegative
                        ? 'bg-red-50 text-red-700 border border-red-200/60'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {isPositive && <TrendingUp className="w-3 h-3" />}
                    {isNegative && <TrendingDown className="w-3 h-3" />}
                    {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
                    {isPositive ? `+${rate.change24h.toFixed(2)}%` : `${rate.change24h.toFixed(2)}%`}
                  </span>
                </div>

                {/* Subtitle */}
                <p className="text-xs text-slate-500 mb-4 font-medium">
                  {rate.pairName}
                </p>

                {/* Rates: Bid / Ask */}
                <div className="mb-4">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {rate.bid.toFixed(rate.quote === 'JPY' ? 2 : 4)}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 ml-1.5">
                    / {rate.ask.toFixed(rate.quote === 'JPY' ? 2 : 4)}
                  </span>
                </div>
              </div>

              {/* Sparkline Graphic */}
              <div className="pt-2 pb-1">
                {renderSparkline(rate.sparkline, rate.change24h)}
              </div>

              {/* Card Bottom Quick Actions on Hover */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  id={`btn-trade-${rate.id.toLowerCase()}`}
                  onClick={() => onQuickTrade(rate.base, rate.quote)}
                  className="text-xs font-bold text-[#0a2540] hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Quick Convert <ArrowRight className="w-3 h-3" />
                </button>
                {onAddToFavorites && (
                  <button
                    onClick={() => onAddToFavorites(rate.base, rate.quote)}
                    title="Add to Favorite Pairs"
                    className="text-slate-400 hover:text-amber-500 transition-colors cursor-pointer p-1"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Pairs button */}
      {filteredRates.length > 4 && (
        <div className="mt-10 text-center">
          <button
            id="btn-load-more-pairs"
            onClick={() => setShowAllPairs(!showAllPairs)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            {showAllPairs ? 'Show Fewer Pairs ▴' : 'Load More Pairs ▾'}
          </button>
        </div>
      )}
    </main>
  );
};

