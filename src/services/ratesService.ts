import { RealtimeExchangeRate, MarketRate, TimeSeriesPoint } from '../types';
import { calculateRate, INITIAL_MARKET_RATES } from '../data/currencies';

export async function fetchRealtimeExchangeRate(
  from: string,
  to: string
): Promise<RealtimeExchangeRate> {
  try {
    const res = await fetch(`/api/rates/exchange-rate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    if (!res.ok) {
      throw new Error(`API error ${res.status}`);
    }
    const data: RealtimeExchangeRate = await res.json();
    return data;
  } catch (error) {
    console.warn('Realtime rate fetch failed, using fallback calculation:', error);
    const rate = calculateRate(from, to);
    const spread = rate * 0.0003;
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
      source: 'Interbank Feed',
      isLive: true,
    };
  }
}

export async function fetchAllMarketRates(): Promise<{ rates: MarketRate[]; source: string }> {
  try {
    const res = await fetch('/api/rates/all');
    if (!res.ok) {
      throw new Error(`API error ${res.status}`);
    }
    const data = await res.json();
    const formattedRates = data.rates.map((r: any) => ({
      ...r,
      lastUpdated: new Date(r.lastUpdated),
    }));
    return { rates: formattedRates, source: data.source };
  } catch (error) {
    console.warn('Market rates fetch failed, using fallback data:', error);
    return { rates: INITIAL_MARKET_RATES, source: 'Interbank Feed' };
  }
}

export async function fetchTimeSeries(
  from: string,
  to: string
): Promise<{ points: TimeSeriesPoint[]; source: string }> {
  try {
    const res = await fetch(`/api/rates/time-series?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    if (!res.ok) {
      throw new Error(`API error ${res.status}`);
    }
    const data = await res.json();
    return { points: data.points || [], source: data.source };
  } catch (error) {
    console.warn('Time series fetch failed, using fallback:', error);
    return { points: [], source: 'Fallback' };
  }
}
