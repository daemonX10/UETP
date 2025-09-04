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
      
      // Override connection status tracking
      const originalConnect = wsRef.current.connect.bind(wsRef.current);
      wsRef.current.connect = () => {
        originalConnect();
        
        // Monitor connection status
        const checkConnection = () => {
          if (wsRef.current) {
            setIsConnected(wsRef.current.isConnected);
            setError(wsRef.current.isConnected ? null : 'WebSocket disconnected');
            
            if (wsRef.current.isConnected) {
              // Re-subscribe to all symbols
              const symbols = Array.from(subscriptionsRef.current);
              if (symbols.length > 0) {
                wsRef.current.subscribe(symbols, handleMarketUpdate);
              }
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
      setError(err instanceof Error ? err.message : 'Failed to connect to market data');
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
    if (!wsRef.current) {
      connect();
    }

    // Add symbols to our tracking
    symbols.forEach(symbol => subscriptionsRef.current.add(symbol));

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
  }, [connect, handleMarketUpdate]);

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

  // Auto-connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Reconnection logic
  useEffect(() => {
    if (!isConnected && wsRef.current) {
      const reconnectTimer = setTimeout(() => {
        console.log('🔄 Attempting to reconnect to market data...');
        connect();
      }, 5000);

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
