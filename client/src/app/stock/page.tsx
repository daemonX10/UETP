'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import useMarketData from '@/hooks/useMarketData';
import { marketAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

export default function StockPage() {
  const { isAuthenticated } = useAuth();
  const { marketData, isConnected } = useMarketData();
  const router = useRouter();

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Sample stock data
  const stockSymbols = [
    'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 
    'SBIN', 'BHARTIARTL', 'WIPRO', 'MARUTI', 'SUNPHARMA',
    'ULTRACEMCO', 'TITAN', 'NESTLEIND', 'TECHM', 'BAJFINANCE'
  ];

  const stockNames = {
    'RELIANCE': 'Reliance Industries Limited',
    'TCS': 'Tata Consultancy Services',
    'INFY': 'Infosys Limited',
    'HDFCBANK': 'HDFC Bank Limited',
    'ICICIBANK': 'ICICI Bank Limited',
    'SBIN': 'State Bank of India',
    'BHARTIARTL': 'Bharti Airtel Limited',
    'WIPRO': 'Wipro Limited',
    'MARUTI': 'Maruti Suzuki India Limited',
    'SUNPHARMA': 'Sun Pharmaceutical Industries',
    'ULTRACEMCO': 'UltraTech Cement Limited',
    'TITAN': 'Titan Company Limited',
    'NESTLEIND': 'Nestle India Limited',
    'TECHM': 'Tech Mahindra Limited',
    'BAJFINANCE': 'Bajaj Finance Limited'
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Load market data
  useEffect(() => {
    loadStockData();
  }, []);

  const loadStockData = async () => {
    try {
      setIsLoading(true);
      
      // Create stock data from symbols
      const stockData = stockSymbols.map(symbol => {
        const data = marketData[symbol];
        return {
          symbol,
          name: stockNames[symbol as keyof typeof stockNames] || symbol,
          price: data?.price || Math.random() * 3000 + 500,
          change: data?.change || (Math.random() - 0.5) * 100,
          changePercent: data?.changePercent || (Math.random() - 0.5) * 10,
          volume: data?.volume || Math.floor(Math.random() * 5000000),
          marketCap: Math.random() * 500000 + 50000,
          high: data?.high || Math.random() * 3000 + 500,
          low: data?.low || Math.random() * 3000 + 500,
          open: data?.open || Math.random() * 3000 + 500,
          previousClose: data?.previousClose || Math.random() * 3000 + 500,
        };
      });

      setStocks(stockData);
    } catch (error) {
      setError('Failed to load stock data');
      console.error('Error loading stocks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStocks = stocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Market Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <h1 className="text-2xl font-bold text-indigo-600 cursor-pointer">UETP</h1>
              </Link>
              <span className="text-sm text-gray-500">Market Data</span>
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm text-gray-500">
                  {isConnected ? 'Live Data' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <Link href="/portfolio">
                <Button variant="outline">Portfolio</Button>
              </Link>
              <Link href="/trading">
                <Button>Trade Now</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 max-w-md">
                <Input
                  type="text"
                  placeholder="Search stocks by symbol or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="text-sm text-gray-500">
                Showing {filteredStocks.length} of {stocks.length} stocks
              </div>
            </div>
          </div>

          {/* Market Indices */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <h3 className="text-sm font-medium text-gray-500">NIFTY 50</h3>
              <p className="text-2xl font-bold text-gray-900">19,842.75</p>
              <p className="text-sm text-green-600">+89.25 (+0.45%)</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <h3 className="text-sm font-medium text-gray-500">SENSEX</h3>
              <p className="text-2xl font-bold text-gray-900">66,598.20</p>
              <p className="text-sm text-green-600">+251.10 (+0.38%)</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <h3 className="text-sm font-medium text-gray-500">BANK NIFTY</h3>
              <p className="text-2xl font-bold text-gray-900">44,324.55</p>
              <p className="text-sm text-green-600">+273.80 (+0.62%)</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
              <h3 className="text-sm font-medium text-gray-500">NIFTY IT</h3>
              <p className="text-2xl font-bold text-gray-900">29,422.40</p>
              <p className="text-sm text-green-600">+322.10 (+1.11%)</p>
            </div>
          </div>

          {/* Stock List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Live Stock Prices</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      High/Low
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStocks.map((stock) => (
                    <tr key={stock.symbol} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{stock.symbol}</div>
                          <div className="text-sm text-gray-500">{stock.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(stock.price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(stock.change)}
                        </div>
                        <div className={`text-xs ${
                          stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercent(stock.changePercent)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stock.volume.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          H: {formatCurrency(stock.high)}
                        </div>
                        <div className="text-sm text-gray-500">
                          L: {formatCurrency(stock.low)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link href={`/trading?symbol=${stock.symbol}&action=BUY`}>
                          <Button size="sm" className="mr-2">Buy</Button>
                        </Link>
                        <Link href={`/trading?symbol=${stock.symbol}&action=SELL`}>
                          <Button size="sm" variant="outline">Sell</Button>
                        </Link>
                        <Link href={`/stock/${stock.symbol}`}>
                          <Button size="sm" variant="ghost">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
