'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import useMarketData from '@/hooks/useMarketData';
import { marketAPI, tradingAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface StockItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap?: number;
  sector?: string;
}

interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
}

export default function MarketplacePage() {
  const { user, isAuthenticated } = useAuth();
  const { marketData, isConnected, subscribe } = useMarketData();
  const router = useRouter();

  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'stocks' | 'indices' | 'watchlist'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockItem[]>([]);
  const [topGainers, setTopGainers] = useState<StockItem[]>([]);
  const [topLosers, setTopLosers] = useState<StockItem[]>([]);
  const [mostActive, setMostActive] = useState<StockItem[]>([]);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>(['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK']);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Load market data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadMarketData();
    }
  }, [isAuthenticated]);

  // Subscribe to watchlist market data
  useEffect(() => {
    if (watchlist.length > 0) {
      const unsubscribe = subscribe(watchlist);
      return unsubscribe;
    }
  }, [watchlist, subscribe]);

  const loadMarketData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate market data since backend endpoints might not be fully implemented
      const mockGainers: StockItem[] = [
        { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', price: 2545.30, change: 65.20, changePercent: 2.63, volume: 1234567, high: 2560, low: 2480, open: 2500, previousClose: 2480.10, marketCap: 1720000, sector: 'Energy' },
        { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3850.75, change: 85.25, changePercent: 2.26, volume: 987654, high: 3875, low: 3780, open: 3800, previousClose: 3765.50, marketCap: 1400000, sector: 'IT' },
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 1678.90, change: 32.15, changePercent: 1.95, volume: 876543, high: 1690, low: 1650, open: 1660, previousClose: 1646.75, marketCap: 950000, sector: 'Banking' },
        { symbol: 'INFY', name: 'Infosys Ltd', price: 1456.20, change: 28.45, changePercent: 1.99, volume: 765432, high: 1470, low: 1435, open: 1440, previousClose: 1427.75, marketCap: 620000, sector: 'IT' },
        { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', price: 1124.55, change: 19.85, changePercent: 1.80, volume: 654321, high: 1135, low: 1110, open: 1115, previousClose: 1104.70, marketCap: 780000, sector: 'Banking' }
      ];

      const mockLosers: StockItem[] = [
        { symbol: 'WIPRO', name: 'Wipro Ltd', price: 415.30, change: -12.45, changePercent: -2.91, volume: 543210, high: 435, low: 410, open: 430, previousClose: 427.75, marketCap: 230000, sector: 'IT' },
        { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', price: 885.60, change: -18.90, changePercent: -2.09, volume: 432109, high: 910, low: 880, open: 900, previousClose: 904.50, marketCap: 520000, sector: 'Telecom' },
        { symbol: 'ITC', name: 'ITC Ltd', price: 462.15, change: -8.25, changePercent: -1.75, volume: 321098, high: 475, low: 460, open: 470, previousClose: 470.40, marketCap: 580000, sector: 'FMCG' },
        { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', price: 11245.80, change: -185.70, changePercent: -1.62, volume: 210987, high: 11500, low: 11200, open: 11400, previousClose: 11431.50, marketCap: 340000, sector: 'Auto' },
        { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', price: 3156.45, change: -48.25, changePercent: -1.51, volume: 109876, high: 3220, low: 3150, open: 3200, previousClose: 3204.70, marketCap: 300000, sector: 'Paint' }
      ];

      const mockActive: StockItem[] = [
        ...mockGainers.slice(0, 3),
        ...mockLosers.slice(0, 2)
      ].sort((a, b) => b.volume - a.volume);

      const mockIndices: MarketIndex[] = [
        { name: 'NIFTY 50', symbol: 'NIFTY50', value: 19876.35, change: 156.80, changePercent: 0.80 },
        { name: 'SENSEX', symbol: 'SENSEX', value: 66589.93, change: 423.54, changePercent: 0.64 },
        { name: 'NIFTY BANK', symbol: 'BANKNIFTY', value: 44789.25, change: 289.45, changePercent: 0.65 },
        { name: 'NIFTY IT', symbol: 'NIFTYIT', value: 35642.18, change: 445.32, changePercent: 1.26 },
        { name: 'NIFTY AUTO', symbol: 'NIFTYAUTO', value: 17854.67, change: -123.45, changePercent: -0.69 }
      ];

      setTopGainers(mockGainers);
      setTopLosers(mockLosers);
      setMostActive(mockActive);
      setIndices(mockIndices);

    } catch (error) {
      console.error('Error loading market data:', error);
      setError('Failed to load market data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      // Simulate search results
      const allStocks = [...topGainers, ...topLosers];
      const filtered = allStocks.filter(stock =>
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleStockAction = (symbol: string, action: 'BUY' | 'SELL') => {
    router.push(`/trading?symbol=${symbol}&action=${action}`);
  };

  const addToWatchlist = (symbol: string) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist([...watchlist, symbol]);
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(watchlist.filter(s => s !== symbol));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)}Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    }
    return value.toLocaleString();
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const StockCard = ({ stock }: { stock: StockItem }) => (
    <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{stock.symbol}</h3>
          <p className="text-sm text-gray-600 truncate max-w-48">{stock.name}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">{formatCurrency(stock.price)}</p>
          <p className={`text-sm ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercent(stock.changePercent)}
          </p>
        </div>
      </div>
      
      <div className="flex justify-between text-sm text-gray-600 mb-3">
        <span>Vol: {stock.volume.toLocaleString()}</span>
        <span>H: ₹{stock.high}</span>
        <span>L: ₹{stock.low}</span>
      </div>
      
      <div className="flex space-x-2">
        <Button 
          size="sm" 
          className="flex-1 bg-green-600 hover:bg-green-700"
          onClick={() => handleStockAction(stock.symbol, 'BUY')}
        >
          Buy
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
          onClick={() => handleStockAction(stock.symbol, 'SELL')}
        >
          Sell
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => watchlist.includes(stock.symbol) ? removeFromWatchlist(stock.symbol) : addToWatchlist(stock.symbol)}
        >
          {watchlist.includes(stock.symbol) ? '★' : '☆'}
        </Button>
      </div>
    </div>
  );

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading marketplace...</p>
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
              <h1 className="text-xl font-semibold text-gray-900">Marketplace</h1>
              <div className="ml-4 flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                <span className="text-sm text-gray-500">
                  {isConnected ? 'Live Data' : 'Simulated Data'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
              <Button onClick={() => router.push('/trading')}>
                Place Order
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Input
              type="text"
              placeholder="Search stocks by symbol or name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-2 bg-white rounded-md shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((stock) => (
                <div 
                  key={stock.symbol} 
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => router.push(`/stock/${stock.symbol}`)}
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{stock.symbol}</p>
                      <p className="text-sm text-gray-600">{stock.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(stock.price)}</p>
                      <p className={`text-sm ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(stock.changePercent)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Market Overview' },
              { id: 'stocks', label: 'Top Stocks' },
              { id: 'indices', label: 'Indices' },
              { id: 'watchlist', label: 'My Watchlist' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Market Indices */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Market Indices</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {indices.map((index) => (
                    <div key={index.symbol} className="bg-white rounded-lg shadow-sm border p-4">
                      <h3 className="font-medium text-gray-900">{index.name}</h3>
                      <p className="text-2xl font-bold mt-2">{index.value.toLocaleString()}</p>
                      <p className={`text-sm ${index.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)} ({formatPercent(index.changePercent)})
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Gainers & Losers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Gainers</h2>
                  <div className="space-y-3">
                    {topGainers.slice(0, 5).map((stock) => (
                      <StockCard key={stock.symbol} stock={stock} />
                    ))}
                  </div>
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Losers</h2>
                  <div className="space-y-3">
                    {topLosers.slice(0, 5).map((stock) => (
                      <StockCard key={stock.symbol} stock={stock} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stocks' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">All Stocks</h2>
                <select 
                  value={selectedSector} 
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="all">All Sectors</option>
                  <option value="IT">Information Technology</option>
                  <option value="Banking">Banking</option>
                  <option value="Energy">Energy</option>
                  <option value="Auto">Automobile</option>
                  <option value="FMCG">FMCG</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...topGainers, ...topLosers]
                  .filter(stock => selectedSector === 'all' || stock.sector === selectedSector)
                  .map((stock) => (
                    <StockCard key={stock.symbol} stock={stock} />
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'indices' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Market Indices</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {indices.map((index) => (
                  <div key={index.symbol} className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{index.name}</h3>
                    <p className="text-3xl font-bold mb-2">{index.value.toLocaleString()}</p>
                    <div className={`flex items-center ${index.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="text-lg font-medium">
                        {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)}
                      </span>
                      <span className="ml-2">({formatPercent(index.changePercent)})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'watchlist' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">My Watchlist</h2>
                <p className="text-sm text-gray-500">{watchlist.length} stocks</p>
              </div>
              
              {watchlist.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Your watchlist is empty.</p>
                  <p className="text-sm text-gray-400 mt-2">Search for stocks and add them to your watchlist.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {watchlist.map((symbol) => {
                    const data = marketData[symbol];
                    const stockData = [...topGainers, ...topLosers].find(s => s.symbol === symbol);
                    
                    if (!stockData) return null;
                    
                    return (
                      <div key={symbol} className="bg-white rounded-lg shadow-sm border p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-gray-900">{symbol}</h3>
                                <p className="text-sm text-gray-600">{stockData.name}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">
                                  ₹{data ? data.price.toFixed(2) : stockData.price.toFixed(2)}
                                </p>
                                <p className={`text-sm ${
                                  (data ? data.changePercent : stockData.changePercent) >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatPercent(data ? data.changePercent : stockData.changePercent)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex justify-between text-sm text-gray-600 mt-2">
                              <span>Vol: {(data ? data.volume : stockData.volume).toLocaleString()}</span>
                              <span>H: ₹{data ? data.high : stockData.high}</span>
                              <span>L: ₹{data ? data.low : stockData.low}</span>
                            </div>
                          </div>
                          
                          <div className="ml-4 flex space-x-2">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleStockAction(symbol, 'BUY')}
                            >
                              Buy
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-red-500 text-red-600 hover:bg-red-50"
                              onClick={() => handleStockAction(symbol, 'SELL')}
                            >
                              Sell
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => removeFromWatchlist(symbol)}
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
