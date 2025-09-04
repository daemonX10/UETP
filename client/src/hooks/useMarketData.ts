'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MarketDataWebSocket } from '@/lib/api';

interface MarketDataItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  lastUpdated: string;
}

interface UseMarketDataReturn {
  marketData: Record<string, MarketDataItem>;
  isConnected: boolean;
  subscribe: (symbols: string[]) => () => void;
  unsubscribe: (symbols: string[]) => void;
  connect: () => void;
  disconnect: () => void;
  error: string | null;
}

export const useMarketData = (): UseMarketDataReturn => {
  const [marketData, setMarketData] = useState<Record<string, MarketDataItem>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<MarketDataWebSocket | null>(null);
  const subscriptionsRef = useRef<Set<string>>(new Set());

  // Generate mock data for when WebSocket is not available
  const generateMockData = useCallback((symbol: string): MarketDataItem => {
    const basePrice = Math.random() * 1000 + 100;
    const change = (Math.random() - 0.5) * 20;
    const changePercent = (change / basePrice) * 100;
    
    return {
      symbol,
      price: Math.round(basePrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: Math.floor(Math.random() * 1000000),
      high: Math.round((basePrice + Math.abs(change)) * 100) / 100,
      low: Math.round((basePrice - Math.abs(change)) * 100) / 100,
      open: Math.round((basePrice - change) * 100) / 100,
      previousClose: Math.round((basePrice - change) * 100) / 100,
      lastUpdated: new Date().toISOString(),
    };
  }, []);

  const handleMarketUpdate = useCallback((data: MarketDataItem[] | MarketDataItem) => {
    const updates = Array.isArray(data) ? data : [data];
    
    setMarketData(prev => {
      const newData = { ...prev };
      updates.forEach(item => {
        if (item.symbol) {
          newData[item.symbol] = item;
        }
      });
      return newData;
    });
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
    }

    try {
      wsRef.current = new MarketDataWebSocket();
      
      const originalConnect = wsRef.current.connect.bind(wsRef.current);
      wsRef.current.connect = () => {
        try {
          originalConnect();
        } catch (err) {
          console.warn('WebSocket connection failed, using mock data:', err);
          setIsConnected(false);
          setError('WebSocket unavailable - using simulated data');
          return;
        }
        
        // Monitor connection status
        const checkConnection = () => {
          if (wsRef.current) {
            setIsConnected(wsRef.current.isConnected);
            
            if (wsRef.current.isConnected) {
              setError(null);
              // Re-subscribe to all symbols
              const symbols = Array.from(subscriptionsRef.current);
              if (symbols.length > 0) {
                wsRef.current.subscribe(symbols, handleMarketUpdate);
              }
            } else {
              setError('WebSocket disconnected - using simulated data');
            }
          }
        };

        // Check connection status periodically
        const interval = setInterval(checkConnection, 1000);
        
        // Clean up interval when component unmounts
        return () => clearInterval(interval);
      };

      wsRef.current.connect();
    } catch (err) {
      console.warn('Failed to create WebSocket connection, using mock data:', err);
      setError('WebSocket service unavailable - using simulated data');
      setIsConnected(false);
    }
  }, [handleMarketUpdate]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    setIsConnected(false);
    subscriptionsRef.current.clear();
  }, []);

  const subscribe = useCallback((symbols: string[]) => {
    // Add symbols to our tracking
    symbols.forEach(symbol => subscriptionsRef.current.add(symbol));

    // If WebSocket is not connected, provide mock data immediately
    if (!wsRef.current || !wsRef.current.isConnected) {
      const mockData: Record<string, MarketDataItem> = {};
      symbols.forEach(symbol => {
        mockData[symbol] = generateMockData(symbol);
      });
      
      setMarketData(prev => ({ ...prev, ...mockData }));
      
      // Update mock data periodically
      const mockInterval = setInterval(() => {
        const updatedMockData: Record<string, MarketDataItem> = {};
        symbols.forEach(symbol => {
          updatedMockData[symbol] = generateMockData(symbol);
        });
        setMarketData(prev => ({ ...prev, ...updatedMockData }));
      }, 3000); // Update every 3 seconds

      // Return unsubscribe function for mock data
      return () => {
        clearInterval(mockInterval);
        symbols.forEach(symbol => subscriptionsRef.current.delete(symbol));
      };
    }

    let subscriptionId: string | null = null;

    if (wsRef.current && wsRef.current.isConnected) {
      subscriptionId = wsRef.current.subscribe(symbols, handleMarketUpdate);
    }

    // Return unsubscribe function
    return () => {
      symbols.forEach(symbol => subscriptionsRef.current.delete(symbol));
      
      if (subscriptionId && wsRef.current) {
        wsRef.current.unsubscribe(subscriptionId);
      }
    };
  }, [handleMarketUpdate, generateMockData]);

  const unsubscribe = useCallback((symbols: string[]) => {
    symbols.forEach(symbol => {
      subscriptionsRef.current.delete(symbol);
      // Remove from market data
      setMarketData(prev => {
        const newData = { ...prev };
        delete newData[symbol];
        return newData;
      });
    });
  }, []);

  // Auto-connect on mount with fallback
  useEffect(() => {
    // Try to connect, but don't fail if WebSocket is unavailable
    try {
      connect();
    } catch (err) {
      console.warn('WebSocket connection failed on mount, will use mock data');
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Reconnection logic with limited attempts
  useEffect(() => {
    if (!isConnected && wsRef.current) {
      const reconnectTimer = setTimeout(() => {
        console.log('🔄 Attempting to reconnect to market data...');
        try {
          connect();
        } catch (err) {
          console.warn('Reconnection failed, continuing with mock data');
        }
      }, 10000); // Retry every 10 seconds

      return () => clearTimeout(reconnectTimer);
    }
  }, [isConnected, connect]);

  return {
    marketData,
    isConnected,
    subscribe,
    unsubscribe,
    connect,
    disconnect,
    error,
  };
};

export default useMarketData;
