'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import useMarketData from '@/hooks/useMarketData';
import { marketAPI, tradingAPI, portfolioAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface StockDetails {
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
  marketCap: number;
  peRatio: number;
  pbRatio: number;
  dividendYield: number;
  eps: number;
  bookValue: number;
  sector: string;
  industry: string;
  description: string;
  week52High: number;
  week52Low: number;
  avgVolume: number;
  sharesOutstanding: number;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  source: string;
  url: string;
}

interface OrderFormData {
  quantity: number;
  price: number;
  orderType: 'MARKET' | 'LIMIT';
  transactionType: 'BUY' | 'SELL';
  product: 'CNC' | 'MIS' | 'NRML';
  validity: 'DAY' | 'IOC';
}

export default function StockDetailPage() {
  const { user, isAuthenticated } = useAuth();
  const { marketData, isConnected, subscribe } = useMarketData();
  const router = useRouter();
  const params = useParams();
  const symbol = (params.symbol as string)?.toUpperCase();

  // State management
  const [stockDetails, setStockDetails] = useState<StockDetails | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'chart' | 'news' | 'financials'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [holdings, setHoldings] = useState<any>(null);

  // Quick order form
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderData, setOrderData] = useState<OrderFormData>({
    quantity: 1,
    price: 0,
    orderType: 'MARKET',
    transactionType: 'BUY',
    product: 'CNC',
    validity: 'DAY',
  });
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState('');
  const [orderError, setOrderError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Load stock data on mount
  useEffect(() => {
    if (symbol && isAuthenticated) {
      loadStockData();
      checkWatchlistStatus();
      loadHoldings();
    }
  }, [symbol, isAuthenticated]);

  // Subscribe to market data
  useEffect(() => {
    if (symbol) {
      const unsubscribe = subscribe([symbol]);
      return unsubscribe;
    }
  }, [symbol, subscribe]);

  // Update order price when market data changes
  useEffect(() => {
    if (symbol && marketData[symbol] && orderData.orderType === 'MARKET') {
      setOrderData(prev => ({
        ...prev,
        price: marketData[symbol].price
      }));
    }
  }, [symbol, marketData, orderData.orderType]);

  const loadStockData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate comprehensive stock data
      const mockStockDetails: StockDetails = {
        symbol: symbol,
        name: getCompanyName(symbol),
        price: getRandomPrice(symbol),
        change: getRandomChange(),
        changePercent: 0,
        volume: Math.floor(Math.random() * 5000000) + 500000,
        high: 0,
        low: 0,
        open: 0,
        previousClose: 0,
        marketCap: Math.floor(Math.random() * 2000000) + 100000,
        peRatio: Math.random() * 30 + 10,
        pbRatio: Math.random() * 5 + 0.5,
        dividendYield: Math.random() * 4,
        eps: Math.random() * 100 + 10,
        bookValue: Math.random() * 1000 + 100,
        sector: getSector(symbol),
        industry: getIndustry(symbol),
        description: getDescription(symbol),
        week52High: 0,
        week52Low: 0,
        avgVolume: Math.floor(Math.random() * 2000000) + 200000,
        sharesOutstanding: Math.floor(Math.random() * 1000000000) + 100000000
      };

      // Calculate derived values
      mockStockDetails.changePercent = (mockStockDetails.change / (mockStockDetails.price - mockStockDetails.change)) * 100;
      mockStockDetails.previousClose = mockStockDetails.price - mockStockDetails.change;
      mockStockDetails.high = mockStockDetails.price + Math.random() * 50;
      mockStockDetails.low = mockStockDetails.price - Math.random() * 50;
      mockStockDetails.open = mockStockDetails.previousClose + (Math.random() - 0.5) * 20;
      mockStockDetails.week52High = mockStockDetails.price + Math.random() * 200;
      mockStockDetails.week52Low = mockStockDetails.price - Math.random() * 200;

      setStockDetails(mockStockDetails);

      // Load news
      const mockNews: NewsItem[] = [
        {
          id: '1',
          title: `${symbol} Reports Strong Q3 Results`,
          summary: `${getCompanyName(symbol)} exceeded expectations with revenue growth of 15% year-over-year.`,
          publishedAt: '2024-01-10T09:30:00Z',
          source: 'Financial Express',
          url: '#'
        },
        {
          id: '2',
          title: `Analysts Upgrade ${symbol} to Buy`,
          summary: 'Multiple brokerages have upgraded their rating citing strong fundamentals and market position.',
          publishedAt: '2024-01-09T14:15:00Z',
          source: 'Economic Times',
          url: '#'
        },
        {
          id: '3',
          title: `${symbol} Announces New Product Launch`,
          summary: 'The company unveiled its latest product line expected to drive growth in the next quarter.',
          publishedAt: '2024-01-08T11:45:00Z',
          source: 'Business Standard',
          url: '#'
        }
      ];

      setNews(mockNews);

      // Generate price history for chart
      const history = [];
      let basePrice = mockStockDetails.price;
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        basePrice += (Math.random() - 0.5) * 20;
        history.push({
          date: date.toISOString().split('T')[0],
          price: Math.max(basePrice, 10),
          volume: Math.floor(Math.random() * 2000000)
        });
      }
      setPriceHistory(history);

    } catch (error) {
      console.error('Error loading stock data:', error);
      setError('Failed to load stock data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkWatchlistStatus = async () => {
    try {
      const response = await portfolioAPI.getWatchlist();
      if (response.success) {
        setIsInWatchlist(response.data.includes(symbol));
      }
    } catch (error) {
      console.error('Error checking watchlist:', error);
    }
  };

  const loadHoldings = async () => {
    try {
      const response = await portfolioAPI.getPortfolio();
      if (response.success && response.data.holdings) {
        const holding = response.data.holdings.find((h: any) => h.symbol === symbol);
        setHoldings(holding);
      }
    } catch (error) {
      console.error('Error loading holdings:', error);
    }
  };

  const toggleWatchlist = async () => {
    try {
      if (isInWatchlist) {
        await portfolioAPI.removeFromWatchlist(symbol);
        setIsInWatchlist(false);
      } else {
        await portfolioAPI.addToWatchlist({ symbol });
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
    }
  };

  const handleQuickOrder = async (action: 'BUY' | 'SELL') => {
    setOrderData(prev => ({ ...prev, transactionType: action }));
    setShowOrderForm(true);
    setOrderError('');
    setOrderSuccess('');
  };

  const submitOrder = async () => {
    try {
      setOrderLoading(true);
      setOrderError('');

      const orderPayload = {
        symbol,
        ...orderData
      };

      const response = await tradingAPI.placeOrder(orderPayload);
      
      if (response.success) {
        setOrderSuccess(`${orderData.transactionType} order placed successfully!`);
        setShowOrderForm(false);
        // Refresh holdings
        loadHoldings();
      } else {
        setOrderError(response.message || 'Failed to place order');
      }
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setOrderLoading(false);
    }
  };

  // Helper functions
  const getCompanyName = (symbol: string): string => {
    const names: { [key: string]: string } = {
      'RELIANCE': 'Reliance Industries Limited',
      'TCS': 'Tata Consultancy Services Limited',
      'HDFCBANK': 'HDFC Bank Limited',
      'INFY': 'Infosys Limited',
      'ICICIBANK': 'ICICI Bank Limited',
      'SBIN': 'State Bank of India',
      'BHARTIARTL': 'Bharti Airtel Limited',
      'ITC': 'ITC Limited',
      'KOTAKBANK': 'Kotak Mahindra Bank Limited',
      'LT': 'Larsen & Toubro Limited'
    };
    return names[symbol] || `${symbol} Limited`;
  };

  const getRandomPrice = (symbol: string): number => {
    const basePrices: { [key: string]: number } = {
      'RELIANCE': 2500,
      'TCS': 3800,
      'HDFCBANK': 1650,
      'INFY': 1450,
      'ICICIBANK': 1120
    };
    const base = basePrices[symbol] || 1000;
    return base + (Math.random() - 0.5) * 200;
  };

  const getRandomChange = (): number => {
    return (Math.random() - 0.5) * 100;
  };

  const getSector = (symbol: string): string => {
    const sectors: { [key: string]: string } = {
      'RELIANCE': 'Energy',
      'TCS': 'Information Technology',
      'HDFCBANK': 'Financial Services',
      'INFY': 'Information Technology',
      'ICICIBANK': 'Financial Services'
    };
    return sectors[symbol] || 'Diversified';
  };

  const getIndustry = (symbol: string): string => {
    const industries: { [key: string]: string } = {
      'RELIANCE': 'Oil & Gas',
      'TCS': 'IT Services',
      'HDFCBANK': 'Private Banks',
      'INFY': 'IT Services',
      'ICICIBANK': 'Private Banks'
    };
    return industries[symbol] || 'Conglomerate';
  };

  const getDescription = (symbol: string): string => {
    const descriptions: { [key: string]: string } = {
      'RELIANCE': 'Reliance Industries Limited is an Indian multinational conglomerate company engaged in energy, petrochemicals, textiles, natural resources, retail, and telecommunications.',
      'TCS': 'Tata Consultancy Services is an Indian multinational information technology services and consulting company with headquarters in Mumbai.',
      'HDFCBANK': 'HDFC Bank Limited is an Indian banking and financial services company headquartered in Mumbai, Maharashtra.',
      'INFY': 'Infosys Limited is an Indian multinational information technology company that provides business consulting, information technology and outsourcing services.',
      'ICICIBANK': 'ICICI Bank Limited is an Indian multinational bank and financial services company headquartered in Mumbai.'
    };
    return descriptions[symbol] || `${getCompanyName(symbol)} is a leading company in its sector with strong market presence and growth prospects.`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number, suffix?: string) => {
    if (value >= 10000000) {
      return `${(value / 10000000).toFixed(2)}Cr${suffix || ''}`;
    } else if (value >= 100000) {
      return `${(value / 100000).toFixed(2)}L${suffix || ''}`;
    }
    return `${value.toLocaleString()}${suffix || ''}`;
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading {symbol} details...</p>
        </div>
      </div>
    );
  }

  if (error || !stockDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Stock</h2>
          <p className="text-gray-600 mb-6">{error || 'Stock not found'}</p>
          <div className="space-x-4">
            <Button onClick={() => loadStockData()}>Try Again</Button>
            <Button variant="outline" onClick={() => router.push('/marketplace')}>
              Back to Marketplace
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentData = marketData[symbol] || stockDetails;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push('/marketplace')}>
                ← Marketplace
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{stockDetails.symbol}</h1>
                <p className="text-sm text-gray-600">{stockDetails.name}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                <span className="text-sm text-gray-500">
                  {isConnected ? 'Live Data' : 'Simulated Data'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={toggleWatchlist}>
                {isInWatchlist ? '★ Watchlist' : '☆ Add to Watchlist'}
              </Button>
              <Button onClick={() => handleQuickOrder('BUY')}>
                Quick Buy
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Price Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Price Info */}
              <div className="lg:col-span-2">
                <div className="flex items-end space-x-4 mb-4">
                  <div>
                    <p className="text-4xl font-bold text-gray-900">
                      {formatCurrency(currentData.price)}
                    </p>
                    <p className={`text-lg font-medium ${
                      currentData.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {currentData.change >= 0 ? '+' : ''}{formatCurrency(currentData.change)} (
                      {formatPercent(currentData.changePercent)})
                    </p>
                  </div>
                  <div className="flex space-x-4 text-sm text-gray-600">
                    <div>
                      <span className="block">Open</span>
                      <span className="font-medium">{formatCurrency(currentData.open)}</span>
                    </div>
                    <div>
                      <span className="block">High</span>
                      <span className="font-medium">{formatCurrency(currentData.high)}</span>
                    </div>
                    <div>
                      <span className="block">Low</span>
                      <span className="font-medium">{formatCurrency(currentData.low)}</span>
                    </div>
                    <div>
                      <span className="block">Volume</span>
                      <span className="font-medium">{formatNumber(currentData.volume)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleQuickOrder('BUY')}
                  >
                    Buy
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50"
                    onClick={() => handleQuickOrder('SELL')}
                  >
                    Sell
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/trading?symbol=${symbol}`)}
                >
                  Advanced Order
                </Button>
                
                {holdings && (
                  <div className="text-sm bg-blue-50 p-3 rounded">
                    <p className="font-medium">Your Holdings</p>
                    <p>Qty: {holdings.quantity} | Avg: {formatCurrency(holdings.avgPrice)}</p>
                    <p className={holdings.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                      P&L: {formatCurrency(holdings.pnl)} ({formatPercent(holdings.pnlPercent)})
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {orderSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800">{orderSuccess}</p>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'chart', label: 'Chart' },
                { id: 'news', label: 'News' },
                { id: 'financials', label: 'Financials' }
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

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Company Info */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">About {stockDetails.name}</h3>
                    <p className="text-gray-700 mb-4">{stockDetails.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Sector:</span>
                        <span className="ml-2 font-medium">{stockDetails.sector}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Industry:</span>
                        <span className="ml-2 font-medium">{stockDetails.industry}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Market Cap:</span>
                        <span className="ml-2 font-medium">{formatNumber(stockDetails.marketCap, 'Cr')}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Shares Outstanding:</span>
                        <span className="ml-2 font-medium">{formatNumber(stockDetails.sharesOutstanding)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Key Statistics */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{stockDetails.peRatio.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">P/E Ratio</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{stockDetails.pbRatio.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">P/B Ratio</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{stockDetails.dividendYield.toFixed(2)}%</p>
                        <p className="text-sm text-gray-500">Dividend Yield</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stockDetails.eps)}</p>
                        <p className="text-sm text-gray-500">EPS</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Market Data Sidebar */}
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Data</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Previous Close</span>
                        <span className="font-medium">{formatCurrency(stockDetails.previousClose)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">52W High</span>
                        <span className="font-medium">{formatCurrency(stockDetails.week52High)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">52W Low</span>
                        <span className="font-medium">{formatCurrency(stockDetails.week52Low)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Avg Volume</span>
                        <span className="font-medium">{formatNumber(stockDetails.avgVolume)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Book Value</span>
                        <span className="font-medium">{formatCurrency(stockDetails.bookValue)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chart' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Chart (30 Days)</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <div className="text-center">
                    <div className="text-gray-400 text-4xl mb-2">📈</div>
                    <p className="text-gray-500">Interactive chart will be displayed here</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Price range: {formatCurrency(Math.min(...priceHistory.map(p => p.price)))} - {formatCurrency(Math.max(...priceHistory.map(p => p.price)))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'news' && (
              <div className="space-y-6">
                {news.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1">{item.title}</h3>
                      <span className="text-sm text-gray-500 ml-4">{item.source}</span>
                    </div>
                    <p className="text-gray-700 mb-3">{item.summary}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{formatDate(item.publishedAt)}</span>
                      <Button size="sm" variant="outline">Read More</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'financials' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Financial Highlights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stockDetails.eps)}</p>
                    <p className="text-sm text-gray-500">Earnings Per Share</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stockDetails.bookValue)}</p>
                    <p className="text-sm text-gray-500">Book Value</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <p className="text-2xl font-bold text-gray-900">{stockDetails.dividendYield.toFixed(2)}%</p>
                    <p className="text-sm text-gray-500">Dividend Yield</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <p className="text-2xl font-bold text-gray-900">{stockDetails.peRatio.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Price to Earnings</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <p className="text-2xl font-bold text-gray-900">{stockDetails.pbRatio.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Price to Book</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(stockDetails.marketCap, 'Cr')}</p>
                    <p className="text-sm text-gray-500">Market Cap</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Order Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Quick {orderData.transactionType} Order</h3>
              <button
                onClick={() => setShowOrderForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                <Input value={symbol} disabled />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={orderData.quantity}
                    onChange={(e) => setOrderData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                  <select
                    value={orderData.orderType}
                    onChange={(e) => setOrderData(prev => ({ ...prev, orderType: e.target.value as 'MARKET' | 'LIMIT' }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="MARKET">Market</option>
                    <option value="LIMIT">Limit</option>
                  </select>
                </div>
              </div>

              {orderData.orderType === 'LIMIT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limit Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={orderData.price}
                    onChange={(e) => setOrderData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              )}

              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between text-sm">
                  <span>Order Value:</span>
                  <span className="font-medium">
                    {formatCurrency(orderData.quantity * (orderData.orderType === 'MARKET' ? currentData.price : orderData.price))}
                  </span>
                </div>
              </div>

              {orderError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {orderError}
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowOrderForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className={`flex-1 ${
                    orderData.transactionType === 'BUY' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  onClick={submitOrder}
                  disabled={orderLoading}
                >
                  {orderLoading ? 'Placing...' : `${orderData.transactionType} ${symbol}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
