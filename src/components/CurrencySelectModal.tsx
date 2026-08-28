import React, { useState, useEffect } from 'react';
import { Search, X, Check, Radio, RefreshCw, ArrowRight } from 'lucide-react';
import { CURRENCIES } from '../data/currencies';
import { Currency, RealtimeExchangeRate } from '../types';
import { fetchRealtimeExchangeRate } from '../services/ratesService';

interface CurrencySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (currencyCode: string) => void;
  selectedCurrency: string;
  excludeCurrency?: string;
  title?: string;
}

export const CurrencySelectModal: React.FC<CurrencySelectModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedCurrency,
  excludeCurrency,
  title = 'Select Currency',
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'major' | 'minor'>('all');
  const [hoveredRate, setHoveredRate] = useState<RealtimeExchangeRate | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setHoveredRate(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const basePairCurrency = excludeCurrency || (selectedCurrency === 'USD' ? 'EUR' : 'USD');

  const currenciesList: Currency[] = Object.values(CURRENCIES).filter((c) => {
    if (excludeCurrency && c.code === excludeCurrency) return true;
    const matchesSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.countryCode.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || c.type === filterType;
    return matchesSearch && matchesType;
  });

  const handlePreviewRate = async (currencyCode: string) => {
    if (currencyCode === basePairCurrency) return;
    setIsLoadingPreview(true);
    try {
      const data = await fetchRealtimeExchangeRate(basePairCurrency, currencyCode);
      setHoveredRate(data);
    } catch {
      // ignore preview errors
    } finally {
      setIsLoadingPreview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
            <p className="text-xs text-slate-500">
              Live rate queries powered by Alpha Vantage CURRENCY_EXCHANGE_RATE API
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Search by currency code (e.g. SGD, EUR) or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-[#0a2540] text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('major')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  filterType === 'major'
                    ? 'bg-[#0a2540] text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                G10 Majors
              </button>
              <button
                onClick={() => setFilterType('minor')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  filterType === 'minor'
                    ? 'bg-[#0a2540] text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Minors & Crosses
              </button>
            </div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 text-blue-600 animate-pulse" />
              Live FX
            </span>
          </div>
        </div>

        {/* Currency List */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-100 flex-1">
          {currenciesList.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No currencies match your search query.
            </div>
          ) : (
            currenciesList.map((currency) => {
              const isSelected = selectedCurrency === currency.code;
              return (
                <button
                  key={currency.code}
                  onMouseEnter={() => handlePreviewRate(currency.code)}
                  onClick={() => {
                    onSelect(currency.code);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors cursor-pointer hover:bg-blue-50/50 ${
                    isSelected ? 'bg-blue-50/80 border border-blue-200/80' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-lg border border-slate-200 shadow-xs">
                      {currency.flag}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {currency.code}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                          {currency.symbol}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{currency.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 font-medium">
                        Select
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Live Rate Preview Footer */}
        {hoveredRate && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
              <span>1 {hoveredRate.from} = </span>
              <strong className="text-blue-700 font-mono">
                {hoveredRate.exchangeRate.toFixed(hoveredRate.to === 'JPY' ? 2 : 4)} {hoveredRate.to}
              </strong>
            </span>
            <span className="text-[11px] text-slate-400">
              Bid: {hoveredRate.bidPrice.toFixed(4)} | Ask: {hoveredRate.askPrice.toFixed(4)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
