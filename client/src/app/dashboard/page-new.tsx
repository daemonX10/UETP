'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import useMarketData from '@/hooks/useMarketData';
import { marketAPI, portfolioAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface StockItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

interface PortfolioData {
  totalValue: number;
  totalInvestment: number;
  totalPnL: number;
  totalPnLPercent: number;
  holdings: any[];
}

export default function DashboardPage() {
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();
  const { marketData, isConnected, subscribe } = useMarketData();
  const router = useRouter();

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [topGainers, setTopGainers] = useState<StockItem[]>([]);
  const [topLosers, setTopLosers] = useState<StockItem[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>(['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK']);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Load initial data
  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  // Subscribe to market data for watchlist
  useEffect(() => {
    if (watchlist.length > 0) {
      const unsubscribe = subscribe(watchlist);
      return unsubscribe;
    }
  }, [watchlist, subscribe]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load portfolio data
      const portfolioResponse = await portfolioAPI.getPortfolio();
      if (portfolioResponse.success) {
        setPortfolio(portfolioResponse.data);
      }

      // Load market data
      const [gainersResponse, losersResponse] = await Promise.all([
        marketAPI.getTopGainers(),
        marketAPI.getTopLosers(),
      ]);

      if (gainersResponse.success) {
        setTopGainers(gainersResponse.data.slice(0, 5));
      }

      if (losersResponse.success) {
        setTopLosers(losersResponse.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">UETP Dashboard</h1>
              <div className="ml-4 flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm text-gray-500">
                  {isConnected ? 'Live Data' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Portfolio Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
              <p className="text-2xl font-bold text-gray-900">
                {portfolio ? formatCurrency(portfolio.totalValue) : '₹0.00'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Investment</h3>
              <p className="text-2xl font-bold text-gray-900">
                {portfolio ? formatCurrency(portfolio.totalInvestment) : '₹0.00'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">P&L</h3>
              <p className={`text-2xl font-bold ${
                portfolio && portfolio.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {portfolio ? formatCurrency(portfolio.totalPnL) : '₹0.00'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">P&L %</h3>
              <p className={`text-2xl font-bold ${
                portfolio && portfolio.totalPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {portfolio ? formatPercent(portfolio.totalPnLPercent) : '0.00%'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Watchlist */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Watchlist</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {watchlist.map((symbol) => {
                  const data = marketData[symbol];
                  return (
                    <div key={symbol} className="px-6 py-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{symbol}</p>
                        <p className="text-sm text-gray-500">
                          Vol: {data ? data.volume.toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ₹{data ? data.price.toFixed(2) : '0.00'}
                        </p>
                        <p className={`text-sm ${
                          data && data.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {data ? formatPercent(data.changePercent) : '0.00%'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Market Movers */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Market Movers</h3>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-green-600 mb-2">Top Gainers</h4>
                  <div className="space-y-2">
                    {topGainers.map((stock) => (
                      <div key={stock.symbol} className="flex justify-between items-center">
                        <span className="text-sm text-gray-900">{stock.symbol}</span>
                        <span className="text-sm text-green-600">
                          {formatPercent(stock.changePercent)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-600 mb-2">Top Losers</h4>
                  <div className="space-y-2">
                    {topLosers.map((stock) => (
                      <div key={stock.symbol} className="flex justify-between items-center">
                        <span className="text-sm text-gray-900">{stock.symbol}</span>
                        <span className="text-sm text-red-600">
                          {formatPercent(stock.changePercent)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => router.push('/portfolio')}
              className="h-12"
            >
              View Portfolio
            </Button>
            <Button 
              onClick={() => router.push('/trading')}
              variant="outline"
              className="h-12"
            >
              Place Order
            </Button>
            <Button 
              onClick={() => router.push('/market')}
              variant="outline"
              className="h-12"
            >
              Market Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
