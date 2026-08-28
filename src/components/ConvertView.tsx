import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpDown, Info, Globe, Shield, Zap, ChevronDown, RefreshCw, BarChart2, Radio, Copy, Check, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';
import { CURRENCIES, calculateRate } from '../data/currencies';
import { CurrencySelectModal } from './CurrencySelectModal';
import { fetchRealtimeExchangeRate } from '../services/ratesService';
import { RealtimeExchangeRate } from '../types';

interface ConvertViewProps {
  userBalance?: number;
  initialFromCurrency?: string;
  initialToCurrency?: string;
  initialAmount?: number;
}

export const ConvertView: React.FC<ConvertViewProps> = ({
  userBalance = 450210.00,
  initialFromCurrency = 'USD',
  initialToCurrency = 'EUR',
  initialAmount = 100000,
}) => {
  const [fromCurrency, setFromCurrency] = useState(initialFromCurrency);
  const [toCurrency, setToCurrency] = useState(initialToCurrency);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [payAmountStr, setPayAmountStr] = useState(
    initialAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
  const [payAmount, setPayAmount] = useState<number>(initialAmount);
  
  // Realtime Rate State
  const [rateData, setRateData] = useState<RealtimeExchangeRate | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState(45);

  // Modal states
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [selectTarget, setSelectTarget] = useState<'from' | 'to'>('from');

  // Fallback initial calculation
  const fallbackRate = calculateRate(fromCurrency, toCurrency);
  const currentRate = rateData?.exchangeRate || fallbackRate;
  const inverseRate = currentRate > 0 ? 1 / currentRate : 0;
  const receiveAmount = payAmount * currentRate;

  // Load Real-time Rate from Alpha Vantage API
  const loadLiveRate = useCallback(async (base: string, quote: string, force: boolean = false) => {
    setIsLoadingRate(true);
    try {
      const data = await fetchRealtimeExchangeRate(base, quote, force);
      setRateData(data);
    } catch (err) {
      console.error('Failed to load real-time rate:', err);
    } finally {
      setIsLoadingRate(false);
      setSecondsRemaining(30);
    }
  }, []);

  // Fetch when currencies change and reset countdown
  useEffect(() => {
    loadLiveRate(fromCurrency, toCurrency, false);
    setSecondsRemaining(30);
  }, [fromCurrency, toCurrency, loadLiveRate]);

  // Live Refresh Clock Countdown (every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          loadLiveRate(fromCurrency, toCurrency, false);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fromCurrency, toCurrency, loadLiveRate]);

  const handlePayAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const cleaned = val.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    setPayAmountStr(val);
    if (!isNaN(num)) {
      setPayAmount(num);
    } else if (cleaned === '') {
      setPayAmount(0);
    }
  };

  const handleBlurPayAmount = () => {
    if (!isNaN(payAmount)) {
      setPayAmountStr(
        payAmount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    }
  };

  const handleSwap = () => {
    const newFrom = toCurrency;
    const newTo = fromCurrency;
    setFromCurrency(newFrom);
    setToCurrency(newTo);
  };

  const openSelect = (target: 'from' | 'to') => {
    setSelectTarget(target);
    setIsSelectModalOpen(true);
  };

  const handleCurrencySelected = (code: string) => {
    if (selectTarget === 'from') {
      if (code === toCurrency) {
        setToCurrency(fromCurrency);
      }
      setFromCurrency(code);
    } else {
      if (code === fromCurrency) {
        setFromCurrency(toCurrency);
      }
      setToCurrency(code);
    }
  };

  const fromCurMeta = CURRENCIES[fromCurrency] || { name: fromCurrency, flag: '🌐', symbol: '$' };
  const toCurMeta = CURRENCIES[toCurrency] || { name: toCurrency, flag: '🌐', symbol: '€' };

  const formatTimer = (s: number) => {
    return `00:${s.toString().padStart(2, '0')}`;
  };

  const rateDecimals = toCurrency === 'JPY' ? 2 : 4;
  const inverseDecimals = fromCurrency === 'JPY' ? 2 : 4;

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Page Heading */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
          <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>Real-Time Alpha Vantage FX Feed Active</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0a2540] tracking-tight">
          Convert Currency
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-xl mx-auto">
          Live interbank currency exchange rates with instant mid-market valuation.
        </p>
      </div>

      {/* Main Converter Card */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 transition-all">
          {/* Top Block: You Pay */}
          <div className="bg-[#f8fafc] rounded-xl p-4 sm:p-5 border border-slate-100 relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Amount
                </label>
                <input
                  id="input-pay-amount"
                  type="text"
                  value={payAmountStr}
                  onChange={handlePayAmountChange}
                  onBlur={handleBlurPayAmount}
                  className="w-full text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 bg-transparent focus:outline-none tracking-tight"
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5">
                  <span>{fromCurMeta.name}</span>
                </p>
              </div>

              {/* Currency Selector Button */}
              <button
                id="btn-select-pay-currency"
                type="button"
                onClick={() => openSelect('from')}
                className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 px-3.5 py-2 rounded-lg text-slate-800 font-semibold text-sm shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer shrink-0 mt-1"
              >
                <Globe className="w-4 h-4 text-slate-500" />
                <span>{fromCurrency}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Swap Button Overlap */}
          <div className="relative flex justify-center -my-3.5 z-10">
            <button
              id="btn-swap-currencies"
              type="button"
              onClick={handleSwap}
              title="Swap currencies"
              className="bg-white border border-slate-200 hover:border-slate-300 p-2.5 rounded-xl text-slate-700 hover:text-slate-950 shadow-xs hover:bg-slate-50 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
            >
              <ArrowUpDown className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>

          {/* Bottom Block: Converted Amount */}
          <div className="bg-[#f8fafc] rounded-xl p-4 sm:p-5 border border-slate-100 relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Converted Result
                </label>
                <div
                  id="text-receive-amount"
                  className={`w-full text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight select-all overflow-hidden text-ellipsis ${
                    isLoadingRate ? 'opacity-60 animate-pulse' : ''
                  }`}
                >
                  {receiveAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5">
                  <span>{toCurMeta.name}</span>
                </p>
              </div>

              {/* Currency Selector Button */}
              <button
                id="btn-select-receive-currency"
                type="button"
                onClick={() => openSelect('to')}
                className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 px-3.5 py-2 rounded-lg text-slate-800 font-semibold text-sm shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer shrink-0 mt-1"
              >
                <Globe className="w-4 h-4 text-slate-500" />
                <span>{toCurrency}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Rate & Live Timer Footer within card */}
          <div className="mt-4 pt-3 px-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 border-t border-slate-100">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>
                1 {fromCurrency} = {currentRate.toFixed(rateDecimals)} {toCurrency}
              </span>
              {rateData?.bidPrice && (
                <span className="text-[11px] font-normal text-slate-400 ml-1 hidden md:inline">
                  (Bid: {rateData.bidPrice.toFixed(rateDecimals)} / Ask: {rateData.askPrice.toFixed(rateDecimals)})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 font-medium">
              <button
                onClick={() => loadLiveRate(fromCurrency, toCurrency)}
                title="Refresh rate now"
                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingRate ? 'animate-spin text-blue-600' : ''}`} />
              </button>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-700">
                Live refresh in <span className="font-semibold text-slate-900">{formatTimer(secondsRemaining)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Currency Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Inverse Exchange Rate</span>
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-base font-bold text-slate-900">
              1 {toCurrency} = {inverseRate.toFixed(inverseDecimals)} {fromCurrency}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Mid-market benchmark rate
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Alpha Vantage FX Feed</span>
              <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-base font-bold text-blue-700 truncate">
              {rateData?.source || 'Alpha Vantage CURRENCY_EXCHANGE_RATE'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Refreshed: {rateData?.lastRefreshed || 'Real-time'} ({rateData?.timeZone || 'UTC'})
            </p>
          </div>
        </div>

        {/* Alpha Vantage Exchange Details Card */}
        {rateData && (
          <div className={`mt-4 rounded-xl p-3.5 text-xs space-y-2 border transition-all ${
            rateData.apiStatus === 'ERROR'
              ? 'bg-rose-50/50 border-rose-200 text-rose-900'
              : rateData.apiStatus === 'RATE_LIMITED'
              ? 'bg-amber-50/50 border-amber-200 text-amber-900'
              : 'bg-slate-50 border-slate-200/80 text-slate-600'
          }`}>
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1.5">
                {rateData.apiStatus === 'ERROR' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                ) : rateData.apiStatus === 'RATE_LIMITED' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                ) : (
                  <Radio className="w-3 h-3 text-emerald-600 animate-pulse shrink-0" />
                )}
                <span className={rateData.apiStatus === 'ERROR' ? 'text-rose-900 font-bold' : rateData.apiStatus === 'RATE_LIMITED' ? 'text-amber-900 font-bold' : 'text-slate-700'}>
                  {rateData.apiStatus === 'ERROR' ? 'Alpha Vantage API Error' : rateData.apiStatus === 'RATE_LIMITED' ? 'Alpha Vantage Rate Limit Quota' : 'Alpha Vantage Exchange Rate Details'}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    rateData.apiStatus === 'ERROR'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : rateData.isLive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {rateData.apiStatus === 'ERROR'
                    ? 'API Call Failed'
                    : rateData.isLive
                    ? 'Live API Feed Active'
                    : 'Rate Limited / Benchmark'}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {rateData.from} → {rateData.to}
                </span>
              </div>
            </div>

            {/* Exact API Error Box if call failed */}
            {(rateData.apiStatus === 'ERROR' || rateData.errorMessage) && (
              <div className="bg-rose-100/70 border border-rose-300/80 rounded-lg p-2.5 text-rose-900 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-rose-700">
                  <span className="flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    Exact API Error Response:
                  </span>
                  <span className="text-[10px] font-mono lowercase text-rose-600">status: {rateData.apiStatus}</span>
                </div>
                <div className="font-mono text-xs bg-white text-rose-800 p-2 rounded border border-rose-200 break-all select-all font-semibold leading-relaxed">
                  {rateData.errorMessage || rateData.apiMessage || 'Unknown error occurred while contacting Alpha Vantage API'}
                </div>
              </div>
            )}

            {/* If rate limited notice from Alpha Vantage */}
            {rateData.apiStatus === 'RATE_LIMITED' && !rateData.errorMessage && rateData.apiMessage && (
              <div className="bg-amber-100/80 border border-amber-300/80 rounded-lg p-2.5 text-amber-900 space-y-1">
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Alpha Vantage Rate Limit Notice:
                </div>
                <div className="font-mono text-xs bg-white text-amber-900 p-2 rounded border border-amber-200 break-all select-all leading-relaxed">
                  {rateData.apiMessage}
                </div>
              </div>
            )}

            {/* Requested API Endpoint URL */}
            {rateData.requestedUrl && (
              <div className="text-[11px] font-mono bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700">
                <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-100">
                  <span className="text-slate-500 font-sans font-bold text-[10px] uppercase tracking-wider">
                    Full Alpha Vantage API Endpoint:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (rateData.requestedUrl) {
                        navigator.clipboard.writeText(rateData.requestedUrl);
                        setCopiedUrl(true);
                        setTimeout(() => setCopiedUrl(false), 2000);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="break-all font-mono leading-relaxed text-slate-800 select-all bg-slate-50 p-2 rounded border border-slate-100 text-[11px]">
                  {rateData.requestedUrl}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60 font-mono">
              <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                <span className="block text-[10px] uppercase font-sans text-slate-400">Exchange Rate</span>
                <span className="font-bold text-slate-900">{rateData.exchangeRate.toFixed(rateDecimals)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                <span className="block text-[10px] uppercase font-sans text-slate-400">Bid Price</span>
                <span className="font-bold text-slate-900">{rateData.bidPrice.toFixed(rateDecimals)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                <span className="block text-[10px] uppercase font-sans text-slate-400">Ask Price</span>
                <span className="font-bold text-slate-900">{rateData.askPrice.toFixed(rateDecimals)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                <span className="block text-[10px] uppercase font-sans text-slate-400">Spread</span>
                <span className="font-bold text-slate-900">{rateData.spread.toFixed(rateDecimals)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Timestamp: {rateData.lastRefreshed}</span>
              <button
                type="button"
                onClick={() => loadLiveRate(fromCurrency, toCurrency, true)}
                className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingRate ? 'animate-spin' : ''}`} />
                Force Trigger Live API Call
              </button>
            </div>
          </div>
        )}

        {/* Quick Common Pairs */}
        <div className="mt-4 flex items-center justify-center flex-wrap gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1">Popular Pairs:</span>
          {[
            { from: 'USD', to: 'SGD' },
            { from: 'EUR', to: 'USD' },
            { from: 'GBP', to: 'USD' },
            { from: 'USD', to: 'JPY' },
            { from: 'AUD', to: 'USD' },
            { from: 'USD', to: 'CAD' },
          ].map((pair) => (
            <button
              key={`${pair.from}-${pair.to}`}
              onClick={() => {
                setFromCurrency(pair.from);
                setToCurrency(pair.to);
              }}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
                fromCurrency === pair.from && toCurrency === pair.to
                  ? 'bg-[#0a2540] text-white border-[#0a2540]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {pair.from}/{pair.to}
            </button>
          ))}
        </div>

        {/* Trust & Live Feed Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Alpha Vantage Verified Data Gateway</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-blue-600" />
            <span>Sub-Second Quote Processing</span>
          </div>
        </div>
      </div>

      {/* Currency Select Modal */}
      <CurrencySelectModal
        isOpen={isSelectModalOpen}
        onClose={() => setIsSelectModalOpen(false)}
        onSelect={handleCurrencySelected}
        selectedCurrency={selectTarget === 'from' ? fromCurrency : toCurrency}
        title={selectTarget === 'from' ? 'Select Base Currency' : 'Select Target Currency'}
      />
    </main>
  );
};


