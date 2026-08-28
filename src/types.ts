export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  countryCode: string;
  decimals: number;
  type: 'fiat' | 'major' | 'minor';
}

export interface MarketRate {
  id: string;
  base: string;
  quote: string;
  pairName: string;
  bid: number;
  ask: number;
  spread: number;
  change24h: number;
  category: 'Majors' | 'Minors' | 'Exotics';
  sparkline: number[];
  high24h: number;
  low24h: number;
  volume24h: string;
  lastUpdated: Date;
}

export interface FavoritePair {
  id: string;
  base: string;
  quote: string;
  baseCountryCode: string;
  quoteCountryCode: string;
  rate: number;
  change24h: number;
  defaultSellAmount: number;
}

export interface Transaction {
  id: string;
  soldAmount: number;
  soldCurrency: string;
  receivedAmount: number;
  receivedCurrency: string;
  exchangeRate: number;
  platformFee: number;
  feeWaived: boolean;
  timestamp: string;
  status: 'Completed' | 'Processing' | 'Settled';
  recipient?: string;
  reference?: string;
}

export interface RealtimeExchangeRate {
  from: string;
  to: string;
  fromName?: string;
  toName?: string;
  exchangeRate: number;
  bidPrice: number;
  askPrice: number;
  spread: number;
  lastRefreshed: string;
  timeZone?: string;
  source: string;
  isLive: boolean;
  cached?: boolean;
  apiStatus?: 'ACTIVE' | 'RATE_LIMITED' | 'NOTICE' | 'ERROR';
  apiMessage?: string;
  requestedUrl?: string;
  note?: string;
}

export interface TimeSeriesPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type ActiveTab = 'convert' | 'market_rates' | 'favorite_pairs';
