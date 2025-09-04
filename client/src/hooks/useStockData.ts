import { useState, useEffect, useCallback } from 'react';
import { upstoxService, StockData, HistoricalData } from '@/lib/upstox';
import UpstoxService from '@/lib/upstox';

export interface UseStockDataOptions {
  symbol?: string;
  instrumentKey?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export interface UseStockDataReturn {
  data: StockData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useStockData(options: UseStockDataOptions): UseStockDataReturn {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { symbol, instrumentKey, autoRefresh = false, refreshInterval = 5000 } = options;

  const fetchData = useCallback(async () => {
    if (!symbol && !instrumentKey) {
      setError('Either symbol or instrumentKey must be provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let key = instrumentKey;
      if (!key && symbol) {
        // Try to get instrument key from popular stocks mapping
        key = UpstoxService.POPULAR_STOCKS[symbol as keyof typeof UpstoxService.POPULAR_STOCKS];
        if (!key) {
          throw new Error(`Instrument key not found for symbol: ${symbol}`);
        }
      }

      const stockData = await upstoxService.getLiveMarketData(key!);
      setData(stockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  }, [symbol, instrumentKey]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only refresh during market hours
      if (UpstoxService.isMarketOpen()) {
        fetchData();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return { data, loading, error, refresh };
}

export interface UseHistoricalDataOptions {
  symbol?: string;
  instrumentKey?: string;
  interval: string;
  fromDate?: string;
  toDate?: string;
  days?: number; // Alternative to fromDate/toDate
}

export interface UseHistoricalDataReturn {
  data: HistoricalData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useHistoricalData(options: UseHistoricalDataOptions): UseHistoricalDataReturn {
  const [data, setData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { symbol, instrumentKey, interval, fromDate, toDate, days = 30 } = options;

  const fetchData = useCallback(async () => {
    if (!symbol && !instrumentKey) {
      setError('Either symbol or instrumentKey must be provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let key = instrumentKey;
      if (!key && symbol) {
        key = UpstoxService.POPULAR_STOCKS[symbol as keyof typeof UpstoxService.POPULAR_STOCKS];
        if (!key) {
          throw new Error(`Instrument key not found for symbol: ${symbol}`);
        }
      }

      let from = fromDate;
      let to = toDate;

      if (!from || !to) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        
        to = endDate.toISOString().split('T')[0];
        from = startDate.toISOString().split('T')[0];
      }

      const historicalData = await upstoxService.getHistoricalData(key!, interval, from!, to!);
      setData(historicalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch historical data');
    } finally {
      setLoading(false);
    }
  }, [symbol, instrumentKey, interval, fromDate, toDate, days]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
}

export interface UseMultipleStocksOptions {
  symbols?: string[];
  instrumentKeys?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseMultipleStocksReturn {
  data: StockData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMultipleStocks(options: UseMultipleStocksOptions): UseMultipleStocksReturn {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { symbols = [], instrumentKeys = [], autoRefresh = false, refreshInterval = 10000 } = options;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let keys = [...instrumentKeys];
      
      // Convert symbols to instrument keys
      for (const symbol of symbols) {
        const key = UpstoxService.POPULAR_STOCKS[symbol as keyof typeof UpstoxService.POPULAR_STOCKS];
        if (key) {
          keys.push(key);
        }
      }

      if (keys.length === 0) {
        setData([]);
        return;
      }

      const stocksData = await upstoxService.getMultipleStocksData(keys);
      setData(stocksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stocks data');
    } finally {
      setLoading(false);
    }
  }, [symbols, instrumentKeys]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (UpstoxService.isMarketOpen()) {
        fetchData();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return { data, loading, error, refresh };
}

// Hook for market status
export function useMarketStatus() {
  const [isOpen, setIsOpen] = useState(UpstoxService.isMarketOpen());

  useEffect(() => {
    const checkMarketStatus = () => {
      setIsOpen(UpstoxService.isMarketOpen());
    };

    // Check every minute
    const interval = setInterval(checkMarketStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return { isMarketOpen: isOpen };
}

// Hook for watchlist management
export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    // Load watchlist from localStorage
    const saved = localStorage.getItem('watchlist');
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse saved watchlist:', err);
      }
    }
  }, []);

  const addToWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => {
      if (prev.includes(symbol)) return prev;
      const updated = [...prev, symbol];
      localStorage.setItem('watchlist', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => {
      const updated = prev.filter(s => s !== symbol);
      localStorage.setItem('watchlist', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isInWatchlist = useCallback((symbol: string) => {
    return watchlist.includes(symbol);
  }, [watchlist]);

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
  };
}
