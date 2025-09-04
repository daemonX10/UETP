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
  const { marketData, isConnected, subscribe, error: marketError } = useMarketData();
  const router = useRouter();

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [topGainers, setTopGainers] = useState<StockItem[]>([]);
  const [topLosers, setTopLosers] = useState<StockItem[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>(['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK']);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

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
      setDataError(null);

      // For now, simulate portfolio data since backend may not have these endpoints
      setPortfolio({
        totalValue: 150000,
        totalInvestment: 120000,
        totalPnL: 30000,
        totalPnLPercent: 25,
        holdings: []
      });

      // Simulate top gainers and losers
      setTopGainers([
        { symbol: 'RELIANCE', price: 2500, change: 50, changePercent: 2.04, volume: 1234567 },
        { symbol: 'TCS', price: 3200, change: 80, changePercent: 2.56, volume: 987654 },
        { symbol: 'HDFCBANK', price: 1650, change: 30, changePercent: 1.85, volume: 876543 },
        { symbol: 'INFY', price: 1400, change: 25, changePercent: 1.82, volume: 765432 },
        { symbol: 'ICICIBANK', price: 950, change: 15, changePercent: 1.60, volume: 654321 }
      ]);

      setTopLosers([
        { symbol: 'WIPRO', price: 400, change: -10, changePercent: -2.44, volume: 543210 },
        { symbol: 'BHARTIARTL', price: 800, change: -15, changePercent: -1.84, volume: 432109 },
        { symbol: 'ITC', price: 350, change: -5, changePercent: -1.41, volume: 321098 },
        { symbol: 'MARUTI', price: 9500, change: -120, changePercent: -1.25, volume: 210987 },
        { symbol: 'ASIANPAINT', price: 3200, change: -35, changePercent: -1.08, volume: 109876 }
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDataError('Failed to load dashboard data. Please refresh the page.');
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to access the dashboard</p>
          <Button onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
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
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                <span className="text-sm text-gray-500">
                  {isConnected ? 'Live Data' : 'Simulated Data'}
                </span>
                {marketError && (
                  <span className="text-xs text-orange-600 max-w-xs truncate">
                    {marketError}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/marketplace')}
                className="text-sm"
              >
                Marketplace
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/portfolio-pro')}
                className="text-sm bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              >
                Professional Portfolio
              </Button>
              <span className="text-sm text-gray-700">
                Welcome, {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email || 'User'}
              </span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Error Banner */}
          {dataError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{dataError}</p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      type="button"
                      onClick={() => setDataError(null)}
                      className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {/* Holdings */}
          {portfolio && portfolio.holdings && portfolio.holdings.length > 0 && (
            <div className="mb-8 bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Your Holdings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        LTP
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        P&L
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {portfolio.holdings.map((holding: any) => {
                      const currentData = marketData[holding.symbol];
                      const currentPrice = currentData ? currentData.price : holding.avgPrice;
                      const pnl = (currentPrice - holding.avgPrice) * holding.quantity;
                      const pnlPercent = ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100;
                      
                      return (
                        <tr key={holding.symbol} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => router.push(`/stock/${holding.symbol}`)}
                              className="text-indigo-600 hover:text-indigo-900 font-medium"
                            >
                              {holding.symbol}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {holding.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(holding.avgPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(currentPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(pnl)}
                              <div className="text-xs">
                                ({formatPercent(pnlPercent)})
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                            <button
                              onClick={() => router.push(`/trading?symbol=${holding.symbol}&action=BUY`)}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              Buy
                            </button>
                            <button
                              onClick={() => router.push(`/trading?symbol=${holding.symbol}&action=SELL`)}
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              Sell
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                    <div key={symbol} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <button
                          onClick={() => router.push(`/stock/${symbol}`)}
                          className="font-medium text-indigo-600 hover:text-indigo-900"
                        >
                          {symbol}
                        </button>
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
                      <div key={stock.symbol} className="flex justify-between items-center hover:bg-gray-50 p-2 rounded">
                        <button
                          onClick={() => router.push(`/stock/${stock.symbol}`)}
                          className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          {stock.symbol}
                        </button>
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
                      <div key={stock.symbol} className="flex justify-between items-center hover:bg-gray-50 p-2 rounded">
                        <button
                          onClick={() => router.push(`/stock/${stock.symbol}`)}
                          className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          {stock.symbol}
                        </button>
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
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => router.push('/portfolio')}
              className="h-12"
            >
              View Portfolio
            </Button>
            <Button 
              onClick={() => router.push('/marketplace')}
              variant="outline"
              className="h-12"
            >
              Marketplace
            </Button>
            <Button 
              onClick={() => router.push('/trading')}
              variant="outline"
              className="h-12"
            >
              Place Order
            </Button>
            <Button 
              onClick={() => router.push('/orders')}
              variant="outline"
              className="h-12"
            >
              My Orders
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
