'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import useMarketData from '@/hooks/useMarketData';
import { tradingAPI, marketAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface OrderFormData {
  symbol: string;
  quantity: number;
  price: number;
  orderType: 'MARKET' | 'LIMIT';
  transactionType: 'BUY' | 'SELL';
  product: 'CNC' | 'MIS' | 'NRML';
  validity: 'DAY' | 'IOC';
}

export default function TradingPage() {
  const { user, isAuthenticated } = useAuth();
  const { marketData, subscribe } = useMarketData();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState<OrderFormData>({
    symbol: searchParams.get('symbol') || '',
    quantity: 1,
    price: 0,
    orderType: 'MARKET',
    transactionType: (searchParams.get('action') as 'BUY' | 'SELL') || 'BUY',
    product: 'CNC',
    validity: 'DAY',
  });

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Subscribe to market data for selected symbol
  useEffect(() => {
    if (formData.symbol) {
      const unsubscribe = subscribe([formData.symbol]);
      return unsubscribe;
    }
  }, [formData.symbol, subscribe]);

  // Update price when market data changes
  useEffect(() => {
    if (formData.symbol && marketData[formData.symbol] && formData.orderType === 'MARKET') {
      setFormData(prev => ({
        ...prev,
        price: marketData[formData.symbol].price
      }));
    }
  }, [formData.symbol, marketData, formData.orderType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' ? parseFloat(value) || 0 : value
    }));
    setError('');
    setSuccess('');
  };

  const searchStocks = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await marketAPI.searchStocks(query);
      if (response.success) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectStock = (stock: any) => {
    setFormData(prev => ({
      ...prev,
      symbol: stock.symbol,
      price: stock.price || 0
    }));
    setSearchResults([]);
  };

  const calculateOrderValue = () => {
    if (formData.orderType === 'MARKET' && marketData[formData.symbol]) {
      return formData.quantity * marketData[formData.symbol].price;
    }
    return formData.quantity * formData.price;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to place orders');
        return;
      }

      const orderData = {
        symbol: formData.symbol.toUpperCase(),
        type: formData.transactionType,
        orderType: formData.orderType,
        quantity: formData.quantity,
        price: formData.orderType === 'LIMIT' ? formData.price : undefined
      };

      console.log('🔄 Placing REAL order:', orderData);

      // Use REAL trading API
      const response = await fetch('http://localhost:5000/api/real-trading/real-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ REAL ORDER EXECUTED:', result.data);
        
        const execution = result.data.execution;
        const portfolio = result.data.portfolio;
        
        setSuccess(`🎉 ${execution.message}
        📊 Execution Details:
        • Order ID: ${execution.orderId}
        • Price: ₹${execution.executionPrice}
        • Fees: ₹${execution.fees}
        ${execution.realizedPnL ? `• P&L: ₹${execution.realizedPnL.toFixed(2)}` : ''}
        
        💰 Portfolio Update:
        • Balance: ₹${portfolio.accountBalance.toFixed(2)}
        • Total Value: ₹${portfolio.totalPortfolioValue.toFixed(2)}
        • Total P&L: ₹${portfolio.totalPnL.toFixed(2)} (${portfolio.totalPnLPercent.toFixed(2)}%)`);
        
        // Reset form
        setFormData(prev => ({
          ...prev,
          quantity: 1,
          price: 0,
        }));

        // Refresh market data to show updated prices
        fetchMarketData();

        // Redirect to portfolio after 3 seconds to show updated holdings
        setTimeout(() => {
          router.push('/orders');
        }, 3000);
      } else {
        setError(result.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('❌ Real order error:', error);
      setError('Network error. Please check if server is running.');
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

  if (!isAuthenticated) {
    return null;
  }

  const currentPrice = marketData[formData.symbol]?.price || 0;
  const orderValue = calculateOrderValue();

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
              <h1 className="text-xl font-semibold text-gray-900">Trading</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email || 'User'}
              </span>
              <Button variant="outline" onClick={() => router.push('/portfolio')}>
                Portfolio
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Place Order</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Symbol Search */}
                <div>
                  <label htmlFor="symbol" className="block text-sm font-medium text-gray-700">
                    Stock Symbol
                  </label>
                  <div className="relative">
                    <Input
                      id="symbol"
                      name="symbol"
                      type="text"
                      placeholder="Search for stocks (e.g., RELIANCE)"
                      value={formData.symbol}
                      onChange={(e) => {
                        handleInputChange(e);
                        searchStocks(e.target.value);
                      }}
                      className="mt-1"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                      {searchResults.slice(0, 5).map((stock) => (
                        <div
                          key={stock.symbol}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => selectStock(stock)}
                        >
                          <div className="font-medium">{stock.symbol}</div>
                          <div className="text-sm text-gray-500">{stock.companyName}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Order Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="transactionType" className="block text-sm font-medium text-gray-700">
                      Action
                    </label>
                    <select
                      id="transactionType"
                      name="transactionType"
                      value={formData.transactionType}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="BUY">Buy</option>
                      <option value="SELL">Sell</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="orderType" className="block text-sm font-medium text-gray-700">
                      Order Type
                    </label>
                    <select
                      id="orderType"
                      name="orderType"
                      value={formData.orderType}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="MARKET">Market</option>
                      <option value="LIMIT">Limit</option>
                    </select>
                  </div>
                </div>

                {/* Quantity and Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                      Quantity
                    </label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      {formData.orderType === 'MARKET' ? 'Market Price' : 'Limit Price'}
                    </label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.orderType === 'MARKET' ? currentPrice : formData.price}
                      onChange={handleInputChange}
                      disabled={formData.orderType === 'MARKET'}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Product and Validity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="product" className="block text-sm font-medium text-gray-700">
                      Product
                    </label>
                    <select
                      id="product"
                      name="product"
                      value={formData.product}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="CNC">CNC (Cash & Carry)</option>
                      <option value="MIS">MIS (Intraday)</option>
                      <option value="NRML">NRML (Normal)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="validity" className="block text-sm font-medium text-gray-700">
                      Validity
                    </label>
                    <select
                      id="validity"
                      name="validity"
                      value={formData.validity}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="DAY">Day</option>
                      <option value="IOC">IOC (Immediate or Cancel)</option>
                    </select>
                  </div>
                </div>

                {/* Order Summary */}
                {formData.symbol && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Order Summary</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Symbol:</span>
                        <span className="font-medium">{formData.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Price:</span>
                        <span>₹{currentPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Order Value:</span>
                        <span className="font-medium">{formatCurrency(orderValue)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error/Success Messages */}
                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}

                {success && (
                  <div className="rounded-md bg-green-50 p-4">
                    <div className="text-sm text-green-700">{success}</div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !formData.symbol || formData.quantity <= 0}
                  className={`w-full ${
                    formData.transactionType === 'BUY' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Placing Order...
                    </>
                  ) : (
                    `${formData.transactionType} ${formData.symbol || 'Stock'}`
                  )}
                </Button>
              </form>
            </div>

            {/* Market Data */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Market Data</h2>
              
              {formData.symbol && marketData[formData.symbol] ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900">{formData.symbol}</h3>
                    <p className="text-3xl font-bold text-gray-900">₹{marketData[formData.symbol].price.toFixed(2)}</p>
                    <p className={`text-lg ${
                      marketData[formData.symbol].change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {marketData[formData.symbol].change >= 0 ? '+' : ''}
                      ₹{marketData[formData.symbol].change.toFixed(2)} (
                      {marketData[formData.symbol].changePercent.toFixed(2)}%)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Open:</span>
                      <span>₹{marketData[formData.symbol].open.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">High:</span>
                      <span>₹{marketData[formData.symbol].high.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Low:</span>
                      <span>₹{marketData[formData.symbol].low.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Volume:</span>
                      <span>{marketData[formData.symbol].volume.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="mt-2">Select a stock to view market data</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
