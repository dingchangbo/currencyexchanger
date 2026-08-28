import { RealtimeExchangeRate, MarketRate, TimeSeriesPoint } from '../types';
import { calculateRate, INITIAL_MARKET_RATES } from '../data/currencies';

function getClientApiKey(): string {
  const env = (import.meta as any)?.env || {};
  const cand =
    env.VITE_ALPHAVANTAGE_API_KEY ||
    env.VITE_ALPHA_VANTAGE_API_KEY ||
    env.VITE_ALPHAVANTAGE_KEY ||
    env.VITE_ALPHA_VANTAGE_KEY ||
    env.VITE_API_KEY;

  if (cand && typeof cand === 'string') {
    const clean = cand.trim().replace(/^["']|["']$/g, '');
    if (clean.length > 0) return clean;
  }
  return '';
}

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

    // If server responded with JSON
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data: RealtimeExchangeRate = await res.json();
      return data;
    }

    // If /api is not found or returned HTML on a static host, try client-side fallback if key is configured
    const clientKey = getClientApiKey();
    if (clientKey) {
      const alphaUrl = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${encodeURIComponent(
        from
      )}&to_currency=${encodeURIComponent(to)}&apikey=${encodeURIComponent(clientKey)}`;
      const alphaRes = await fetch(alphaUrl);
      if (alphaRes.ok) {
        const alphaData = await alphaRes.json();
        const fxData = alphaData['Realtime Currency Exchange Rate'];
        if (fxData && fxData['5. Exchange Rate']) {
          const rate = parseFloat(fxData['5. Exchange Rate']);
          const bid = parseFloat(fxData['8. Bid Price'] || '0') || rate * 0.9998;
          const ask = parseFloat(fxData['9. Ask Price'] || '0') || rate * 1.0002;
          const masked = clientKey.length > 6 ? `${clientKey.slice(0, 3)}...${clientKey.slice(-4)}` : '***';
          return {
            from: fxData['1. From_Currency Code'] || from,
            fromName: fxData['2. From_Currency Name'] || from,
            to: fxData['3. To_Currency Code'] || to,
            toName: fxData['4. To_Currency Name'] || to,
            exchangeRate: rate,
            bidPrice: bid,
            askPrice: ask,
            spread: Math.abs(ask - bid),
            lastRefreshed: fxData['6. Last Refreshed'] || new Date().toISOString(),
            timeZone: fxData['7. Time Zone'] || 'UTC',
            source: 'Alpha Vantage Live API (Direct)',
            isLive: true,
            apiStatus: 'ACTIVE',
            requestedUrl: `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${masked}`,
          };
        }
      }
    }

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
