'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Activity, 
  BarChart3,
  Eye,
  EyeOff,
  RefreshCcw,
  Download,
  Filter,
  Search,
  Calendar,
  ArrowUpDown,
  Target,
  AlertCircle
} from 'lucide-react';

// Professional Portfolio Dashboard Component
export default function ProfessionalPortfolioPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [marketData, setMarketData] = useState({});
  const [tradingHistory, setTradingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBalances, setShowBalances] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('value');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch real portfolio data from our API
  const fetchPortfolioData = async () => {
    try {
      setRefreshing(true);
      
      // Get JWT token from localStorage (assuming user is logged in)
      const token = localStorage.getItem('authToken') || 'demo-token';
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch real portfolio data
      const portfolioResponse = await fetch('http://localhost:5000/api/real-trading/real-portfolio', {
        headers
      });
      
      if (portfolioResponse.ok) {
        const portfolioData = await portfolioResponse.json();
        setPortfolio(portfolioData.data);
        console.log('📊 Real Portfolio Data:', portfolioData.data);
      } else {
        console.warn('Portfolio API not available, using demo data');
        setPortfolio(getDemoPortfolioData());
      }

      // Fetch real market data
      const marketResponse = await fetch('http://localhost:5000/api/real-trading/real-market-data');
      
      if (marketResponse.ok) {
        const marketDataResponse = await marketResponse.json();
        setMarketData(marketDataResponse.data.stocks || {});
        console.log('📈 Real Market Data:', marketDataResponse.data);
      } else {
        console.warn('Market API not available, using demo data');
        setMarketData(getDemoMarketData());
      }

      // Fetch trading history
      const historyResponse = await fetch('http://localhost:5000/api/real-trading/trading-history', {
        headers
      });
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setTradingHistory(historyData.data.trades || []);
      } else {
        setTradingHistory(getDemoTradingHistory());
      }

    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      setError('Failed to fetch portfolio data');
      // Use demo data as fallback
      setPortfolio(getDemoPortfolioData());
      setMarketData(getDemoMarketData());
      setTradingHistory(getDemoTradingHistory());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load portfolio data
  useEffect(() => {
    if (isAuthenticated) {
      loadPortfolio();
    }
  }, [isAuthenticated]);

  // Subscribe to market data for holdings
  useEffect(() => {
    if (portfolio?.holdings) {
      const symbols = portfolio.holdings.map(h => h.symbol);
      if (symbols.length > 0) {
        const unsubscribe = subscribe(symbols);
        return unsubscribe;
      }
    }
  }, [portfolio?.holdings, subscribe]);

  const loadPortfolio = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await portfolioAPI.getPortfolio();
      if (response.success) {
        setPortfolio(response.data);
      } else {
        setError(response.message || 'Failed to load portfolio');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load portfolio');
    } finally {
      setIsLoading(false);
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

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                ← Dashboard
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Portfolio</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
              <Button onClick={() => router.push('/trading')}>
                Place Order
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Portfolio Summary */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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
              <h3 className="text-sm font-medium text-gray-500">Total P&L</h3>
              <p className={`text-2xl font-bold ${
                portfolio && portfolio.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {portfolio ? formatCurrency(portfolio.totalPnL) : '₹0.00'}
              </p>
              <p className={`text-sm ${
                portfolio && portfolio.totalPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {portfolio ? formatPercent(portfolio.totalPnLPercent) : '0.00%'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Day P&L</h3>
              <p className={`text-2xl font-bold ${
                portfolio && portfolio.dayPnL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {portfolio ? formatCurrency(portfolio.dayPnL || 0) : '₹0.00'}
              </p>
              <p className={`text-sm ${
                portfolio && portfolio.dayPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {portfolio ? formatPercent(portfolio.dayPnLPercent || 0) : '0.00%'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Available Balance</h3>
              <p className="text-2xl font-bold text-gray-900">
                {portfolio ? formatCurrency(portfolio.availableBalance) : '₹0.00'}
              </p>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Holdings</h3>
            </div>
            
            {portfolio?.holdings && portfolio.holdings.length > 0 ? (
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
                        Current Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Market Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        P&L
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Day Change
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {portfolio.holdings.map((holding) => {
                      const liveData = marketData[holding.symbol];
                      const currentPrice = liveData?.price || holding.currentPrice;
                      const dayChange = liveData?.change || 0;
                      const dayChangePercent = liveData?.changePercent || 0;
                      
                      return (
                        <tr key={holding.symbol}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{holding.symbol}</div>
                              <div className="text-sm text-gray-500">{holding.companyName}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {holding.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{holding.averagePrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{currentPrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(currentPrice * holding.quantity)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(holding.pnl)}
                            </div>
                            <div className={`text-xs ${
                              holding.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatPercent(holding.pnlPercent)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              dayChange >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ₹{dayChange.toFixed(2)}
                            </div>
                            <div className={`text-xs ${
                              dayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatPercent(dayChangePercent)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/trading?symbol=${holding.symbol}&action=sell`)}
                            >
                              Sell
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No holdings</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by placing your first order.</p>
                  <div className="mt-6">
                    <Button onClick={() => router.push('/trading')}>
                      Place Order
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
