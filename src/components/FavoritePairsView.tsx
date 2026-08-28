import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Plus, TrendingUp, TrendingDown, Minus, Trash2, X, Calculator, Radio, RefreshCw, AlertCircle } from 'lucide-react';
import { INITIAL_FAVORITE_PAIRS, CURRENCIES, calculateRate } from '../data/currencies';
import { FavoritePair } from '../types';
import { fetchRealtimeExchangeRate } from '../services/ratesService';

interface FavoritePairsViewProps {
  searchQuery: string;
  onNavigateToConverter?: (base: string, quote: string, amount: number) => void;
  userBalance?: number;
}

export const FavoritePairsView: React.FC<FavoritePairsViewProps> = ({
  searchQuery,
  onNavigateToConverter,
}) => {
  const [favoritePairs, setFavoritePairs] = useState<FavoritePair[]>(INITIAL_FAVORITE_PAIRS);
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [isUpdating, setIsUpdating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Per-card sell amount state
  const [sellAmounts, setSellAmounts] = useState<Record<string, number>>({
    'EUR-USD': 10000,
    'GBP-USD': 5000,
    'USD-JPY': 1000,
  });

  // Modal for Add Pair
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBase, setNewBase] = useState('AUD');
  const [newQuote, setNewQuote] = useState('USD');

  const updateRates = async () => {
    setIsUpdating(true);
    let lastError: string | null = null;
    try {
      const updated = await Promise.all(
        favoritePairs.map(async (pair) => {
          try {
            const data = await fetchRealtimeExchangeRate(pair.base, pair.quote);
            if (data.apiStatus === 'ERROR' && data.errorMessage) {
              lastError = `${pair.base}/${pair.quote}: ${data.errorMessage}`;
            }
            if (data.exchangeRate) {
              return {
                ...pair,
                rate: Number(data.exchangeRate.toFixed(pair.quote === 'JPY' ? 2 : 4)),
              };
            }
          } catch (err: any) {
            lastError = `${pair.base}/${pair.quote}: ${err?.message || 'Failed to fetch'}`;
          }
          return pair;
        })
      );
      setFavoritePairs(updated);
      setApiError(lastError);
    } catch (err: any) {
      setApiError(err?.message || 'Failed to update rates');
    } finally {
      setIsUpdating(false);
      setSecondsRemaining(30);
    }
  };

  // Refresh live rates for favorite pairs on mount and periodic tick
  useEffect(() => {
    updateRates();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          updateRates();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [favoritePairs]);

  // Handle Sell Amount change
  const handleAmountChange = (pairId: string, value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned) || 0;
    setSellAmounts((prev) => ({ ...prev, [pairId]: num }));
  };

  // Navigate to Convert View with preset
  const handleCardOpenConverter = (pair: FavoritePair) => {
    const sellAmount = sellAmounts[pair.id] ?? pair.defaultSellAmount;
    if (onNavigateToConverter) {
      onNavigateToConverter(pair.base, pair.quote, sellAmount);
    }
  };

  // Swap Base & Quote for a card
  const handleSwapCard = async (pairId: string) => {
    const pair = favoritePairs.find((p) => p.id === pairId);
    if (!pair) return;

    const newBaseCode = pair.quote;
    const newQuoteCode = pair.base;
    const baseCur = CURRENCIES[newBaseCode];
    const quoteCur = CURRENCIES[newQuoteCode];

    let liveRate = 1 / pair.rate;
    try {
      const data = await fetchRealtimeExchangeRate(newBaseCode, newQuoteCode);
      if (data.exchangeRate) {
        liveRate = data.exchangeRate;
      }
    } catch {
      // fallback
    }

    setFavoritePairs((prev) =>
      prev.map((p) => {
        if (p.id !== pairId) return p;

        return {
          ...p,
          id: `${newBaseCode}-${newQuoteCode}`,
          base: newBaseCode,
          quote: newQuoteCode,
          baseCountryCode: baseCur?.countryCode || newBaseCode.slice(0, 2),
          quoteCountryCode: quoteCur?.countryCode || newQuoteCode.slice(0, 2),
          rate: Number(liveRate.toFixed(newQuoteCode === 'JPY' ? 2 : 4)),
          change24h: -p.change24h,
        };
      })
    );
  };

  // Remove a favorite
  const handleRemoveFavorite = (pairId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoritePairs((prev) => prev.filter((p) => p.id !== pairId));
  };

  // Add new pair submit
  const handleAddPairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newBase === newQuote) return;

    const pairId = `${newBase}-${newQuote}`;
    if (favoritePairs.some((p) => p.id === pairId)) {
      setIsAddModalOpen(false);
      return;
    }

    let rate = calculateRate(newBase, newQuote);
    try {
      const data = await fetchRealtimeExchangeRate(newBase, newQuote);
      if (data.exchangeRate) {
        rate = data.exchangeRate;
      }
    } catch {
      // Fallback
    }

    const baseCur = CURRENCIES[newBase];
    const quoteCur = CURRENCIES[newQuote];

    const newPair: FavoritePair = {
      id: pairId,
      base: newBase,
      quote: newQuote,
      baseCountryCode: baseCur?.countryCode || newBase.slice(0, 2),
      quoteCountryCode: quoteCur?.countryCode || newQuote.slice(0, 2),
      rate: Number(rate.toFixed(newQuote === 'JPY' ? 2 : 4)),
      change24h: Number(((Math.random() - 0.5) * 0.8).toFixed(2)),
      defaultSellAmount: newBase === 'JPY' ? 100000 : 5000,
    };

    setFavoritePairs((prev) => [...prev, newPair]);
    setSellAmounts((prev) => ({ ...prev, [pairId]: newPair.defaultSellAmount }));
    setIsAddModalOpen(false);
  };

  // Filtered list
  const filteredFavorites = favoritePairs.filter((p) => {
    return (
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.base.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.quote.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-semibold mb-2">
            <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
            <span>Alpha Vantage Monitored Pairs</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0a2540] tracking-tight">
            Favorite Pairs
          </h1>
          <div className="text-sm text-slate-600 mt-1 flex flex-wrap items-center gap-3">
            <span>Compare and calculate live interbank rates across your monitored currency pairs.</span>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live refresh in <strong className="text-slate-800 font-mono">00:{secondsRemaining.toString().padStart(2, '0')}</strong></span>
              <button
                onClick={updateRates}
                title="Refresh favorite rates now"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold cursor-pointer ml-1"
              >
                <RefreshCw className={`w-3 h-3 mr-0.5 ${isUpdating ? 'animate-spin' : ''}`} />
                Sync
              </button>
            </div>
          </div>
        </div>

        <button
          id="btn-favorites-filter"
          onClick={() => setIsAddModalOpen(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-blue-600" />
          <span>Add Custom Pair</span>
        </button>
      </div>

      {/* API Error Banner if present */}
      {apiError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-900">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-800">Alpha Vantage / Favorite Pairs API Error</p>
              <p className="font-mono text-[11px] text-rose-700 mt-0.5 break-all select-all bg-white/80 p-1.5 rounded border border-rose-200">
                {apiError}
              </p>
            </div>
          </div>
          <button
            onClick={updateRates}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
            Retry Sync
          </button>
        </div>
      )}

      {/* Grid: 3 Favorite Pair Cards + 1 Add Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFavorites.map((pair) => {
          const isPositive = pair.change24h > 0;
          const isNegative = pair.change24h < 0;
          const sellAmount = sellAmounts[pair.id] ?? pair.defaultSellAmount;
          const buyAmount = sellAmount * pair.rate;

          return (
            <div
              key={pair.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between group hover:border-slate-300 relative"
            >
              <div>
                {/* Card Top: Flag Pills + Pair Name + Change Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    {/* Overlapping Country Badges */}
                    <div className="flex items-center -space-x-1.5 font-bold text-[10px]">
                      <span className="w-6 h-6 rounded-full bg-slate-100 border border-white flex items-center justify-center text-slate-700 shadow-2xs">
                        {pair.baseCountryCode}
                      </span>
                      <span className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-slate-800 shadow-2xs">
                        {pair.quoteCountryCode}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                      {pair.base} / {pair.quote}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Badge */}
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isPositive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : isNegative
                          ? 'bg-red-50 text-red-700 border border-red-200/60'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isPositive && <TrendingUp className="w-3 h-3" />}
                      {isNegative && <TrendingDown className="w-3 h-3" />}
                      {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
                      {isPositive ? `+${pair.change24h.toFixed(2)}%` : `${pair.change24h.toFixed(2)}%`}
                    </span>

                    {/* Remove button */}
                    <button
                      onClick={(e) => handleRemoveFavorite(pair.id, e)}
                      title="Remove from favorites"
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Current Rate */}
                <div className="mb-4">
                  <p className="text-xs text-slate-500 font-medium">Interbank Rate</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    {pair.rate.toLocaleString(undefined, {
                      minimumFractionDigits: pair.quote === 'JPY' ? 2 : 4,
                      maximumFractionDigits: pair.quote === 'JPY' ? 2 : 4,
                    })}
                  </p>
                </div>

                {/* Quick Inputs (Sell / Buy) */}
                <div className="space-y-1.5 mb-5 relative">
                  {/* Sell Input Box */}
                  <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Base</span>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                      <input
                        type="text"
                        value={sellAmount.toLocaleString()}
                        onChange={(e) => handleAmountChange(pair.id, e.target.value)}
                        className="w-24 text-right bg-transparent focus:outline-none focus:text-blue-600 font-bold"
                      />
                      <span className="text-slate-600 text-xs font-semibold">{pair.base}</span>
                    </div>
                  </div>

                  {/* Swap Icon */}
                  <div className="relative flex justify-center -my-2.5 z-10">
                    <button
                      type="button"
                      onClick={() => handleSwapCard(pair.id)}
                      title="Invert pair"
                      className="bg-white border border-slate-200 hover:border-slate-300 p-1.5 rounded-full text-slate-600 hover:text-slate-900 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Buy Output Box */}
                  <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Converted</span>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                      <span>
                        {buyAmount.toLocaleString(undefined, {
                          minimumFractionDigits: pair.quote === 'JPY' ? 0 : 2,
                          maximumFractionDigits: pair.quote === 'JPY' ? 0 : 2,
                        })}
                      </span>
                      <span className="text-slate-600 text-xs font-semibold">{pair.quote}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* View in Converter CTA Button */}
              <button
                id={`btn-open-converter-${pair.id.toLowerCase()}`}
                onClick={() => handleCardOpenConverter(pair)}
                className="w-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all shadow-2xs cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <Calculator className="w-3.5 h-3.5 text-blue-600" />
                <span>Open in Converter</span>
              </button>
            </div>
          );
        })}

        {/* Card 4: Add Pair (Dashed border card) */}
        <div
          id="card-add-favorite-pair"
          onClick={() => setIsAddModalOpen(true)}
          className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-slate-400 bg-slate-50/50 hover:bg-white cursor-pointer transition-all min-h-[300px] group"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-slate-200/80 flex items-center justify-center text-slate-600 group-hover:text-slate-900 transition-colors mb-4 shadow-2xs">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-900 transition-colors">
            Add Pair
          </h3>
          <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
            Track and compare a new currency combination
          </p>
        </div>
      </div>

      {/* Add Pair Modal Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">Add Favorite Currency Pair</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPairSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Base Currency
                </label>
                <select
                  value={newBase}
                  onChange={(e) => setNewBase(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                >
                  {Object.values(CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Quote Currency
                </label>
                <select
                  value={newQuote}
                  onChange={(e) => setNewQuote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                >
                  {Object.values(CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {newBase === newQuote && (
                <p className="text-xs text-red-600 font-medium">
                  Base and quote currencies must be different.
                </p>
              )}

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newBase === newQuote}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#082c5e] hover:bg-[#062147] rounded-lg transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  Add Pair
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};


