import { RealtimeExchangeRate, MarketRate, TimeSeriesPoint } from '../types';
import { calculateRate, INITIAL_MARKET_RATES } from '../data/currencies';

export async function fetchRealtimeExchangeRate(
  from: string,
  to: string,
  nocache: boolean = false
): Promise<RealtimeExchangeRate> {
  try {
    const res = await fetch(
      `/api/rates/exchange-rate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${
        nocache ? '&nocache=true' : ''
      }`
    );

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
    }
    const data: RealtimeExchangeRate = await res.json();
    return data;
  } catch (error: any) {
    console.warn('Realtime rate fetch failed:', error);
    const rate = calculateRate(from, to);
    const spread = rate * 0.0004;
    const errMsg = error?.message || 'Failed to connect to API endpoint';
    return {
      from,
      to,
      fromName: from,
      toName: to,
      exchangeRate: rate,
      bidPrice: rate - spread / 2,
      askPrice: rate + spread / 2,
      spread,
      lastRefreshed: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      source: 'Interbank Estimate (Network Offline)',
      isLive: false,
      apiStatus: 'ERROR',
      errorMessage: errMsg,
      apiMessage: errMsg,
      requestedUrl: `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=...`,
    };
  }
}

export async function fetchAllMarketRates(): Promise<{ rates: MarketRate[]; source: string; error?: string }> {
  try {
    const res = await fetch('/api/rates/all');
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    const formattedRates = data.rates.map((r: any) => ({
      ...r,
      lastUpdated: new Date(r.lastUpdated),
    }));
    return { rates: formattedRates, source: data.source };
  } catch (error: any) {
    console.warn('Market rates fetch failed, using fallback data:', error);
    return { rates: INITIAL_MARKET_RATES, source: 'Interbank Feed', error: error?.message || 'Failed to load live market feed' };
  }
}

export async function fetchTimeSeries(
  from: string,
  to: string
): Promise<{ points: TimeSeriesPoint[]; source: string; error?: string }> {
  try {
    const res = await fetch(`/api/rates/time-series?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return { points: data.points || [], source: data.source };
  } catch (error: any) {
    console.warn('Time series fetch failed, using fallback:', error);
    return { points: [], source: 'Fallback', error: error?.message || 'Failed to fetch historical series' };
  }
}
