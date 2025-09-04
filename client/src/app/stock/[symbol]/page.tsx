"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface StockDetailProps {
  params: {
    symbol: string;
  };
}

// Mock data for stock details
const getStockDetails = (symbol: string) => ({
  symbol: symbol,
  name: getStockName(symbol),
  price: 1630.5,
  change: 1.2,
  changeAmount: 19.30,
  volume: "2.4M",
  marketCap: "₹8.9L Cr",
  peRatio: 18.5,
  pbRatio: 2.3,
  dividendYield: 1.2,
  week52High: 1750.0,
  week52Low: 1350.0,
  dayHigh: 1645.0,
  dayLow: 1620.0,
  avgVolume: "2.1M",
  eps: 88.2,
  bookValue: 708.5,
  faceValue: 1.0,
});

function getStockName(symbol: string): string {
  const names: { [key: string]: string } = {
    HDFCBANK: "HDFC Bank Limited",
    RELIANCE: "Reliance Industries Limited",
    INFY: "Infosys Limited",
    TCS: "Tata Consultancy Services",
    ICICIBANK: "ICICI Bank Limited",
    SBIN: "State Bank of India",
  };
  return names[symbol] || `${symbol} Limited`;
}

// Mock chart data
const generateChartData = (timeframe: string) => {
  const dataPoints = timeframe === "1D" ? 100 : timeframe === "1W" ? 50 : 30;
  const basePrice = 1630.5;
  const data = [];
  
  for (let i = 0; i < dataPoints; i++) {
    const variance = (Math.random() - 0.5) * 20;
    data.push({
      time: i,
      price: basePrice + variance,
      volume: Math.floor(Math.random() * 100000) + 50000,
    });
  }
  return data;
};

function TradingChart({ timeframe }: { timeframe: string }) {
  const data = generateChartData(timeframe);
  const maxPrice = Math.max(...data.map(d => d.price));
  const minPrice = Math.min(...data.map(d => d.price));
  const priceRange = maxPrice - minPrice;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="h-80 relative">
        <svg width="100%" height="100%" className="overflow-visible">
          <defs>
            <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#10B981", stopOpacity: 0.2 }} />
              <stop offset="100%" style={{ stopColor: "#10B981", stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          
          {/* Price line */}
          <polyline
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            points={data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - ((point.price - minPrice) / priceRange) * 80;
              return `${x}%,${y}%`;
            }).join(" ")}
          />
          
          {/* Fill area */}
          <polygon
            fill="url(#priceGradient)"
            points={[
              ...data.map((point, index) => {
                const x = (index / (data.length - 1)) * 100;
                const y = 100 - ((point.price - minPrice) / priceRange) * 80;
                return `${x}%,${y}%`;
              }),
              "100%,100%",
              "0%,100%"
            ].join(" ")}
          />
        </svg>
        
        {/* Price labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-12">
          <span>₹{maxPrice.toFixed(1)}</span>
          <span>₹{((maxPrice + minPrice) / 2).toFixed(1)}</span>
          <span>₹{minPrice.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

function TimeframeSelector({ selected, onSelect }: { selected: string; onSelect: (tf: string) => void }) {
  const timeframes = ["1D", "1W", "1M", "3M", "6M", "1Y"];
  
  return (
    <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
      {timeframes.map((tf) => (
        <button
          key={tf}
          onClick={() => onSelect(tf)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            selected === tf
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}

export default function StockDetailPage({ params }: StockDetailProps) {
  const [timeframe, setTimeframe] = useState("1D");
  const [isLoading, setIsLoading] = useState(true);
  const stock = getStockDetails(params.symbol);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading stock data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-700">TradeDash</Link>
              <nav className="ml-8 flex space-x-6">
                <Link href="/" className="text-gray-700 hover:text-blue-800">Home</Link>
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-800">Dashboard</Link>
                <Link href="/markets" className="text-gray-700 hover:text-blue-800">Markets</Link>
              </nav>
            </div>
            <div className="text-sm text-gray-600">
              Market: <span className="text-green-600 font-semibold">OPEN</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stock Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center mb-2">
                <h1 className="text-3xl font-bold text-gray-900 mr-4">{stock.symbol}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  stock.change >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  NSE
                </span>
              </div>
              <p className="text-lg text-gray-600">{stock.name}</p>
            </div>
            
            <div className="text-right">
              <div className={`text-4xl font-bold mb-1 ${
                stock.change >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                ₹{stock.price.toFixed(2)}
              </div>
              <div className={`text-lg ${
                stock.change >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                {stock.change >= 0 ? "+" : ""}{stock.changeAmount.toFixed(2)} ({stock.change >= 0 ? "+" : ""}{stock.change}%)
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Price Chart</h2>
              <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />
            </div>
            <TradingChart timeframe={timeframe} />
            
            {/* Key Statistics */}
            <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Key Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Day's Range</div>
                  <div className="font-semibold">₹{stock.dayLow} - ₹{stock.dayHigh}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">52W Range</div>
                  <div className="font-semibold">₹{stock.week52Low} - ₹{stock.week52High}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Volume</div>
                  <div className="font-semibold">{stock.volume}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Avg Volume</div>
                  <div className="font-semibold">{stock.avgVolume}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Fundamentals */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Fundamentals</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Market Cap</span>
                  <span className="font-semibold">{stock.marketCap}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">P/E Ratio</span>
                  <span className="font-semibold">{stock.peRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">P/B Ratio</span>
                  <span className="font-semibold">{stock.pbRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dividend Yield</span>
                  <span className="font-semibold">{stock.dividendYield}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">EPS</span>
                  <span className="font-semibold">₹{stock.eps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Book Value</span>
                  <span className="font-semibold">₹{stock.bookValue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Face Value</span>
                  <span className="font-semibold">₹{stock.faceValue}</span>
                </div>
              </div>
            </div>

            {/* Trading Actions */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-medium">
                  Buy
                </button>
                <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 font-medium">
                  Sell
                </button>
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium">
                  Add to Watchlist
                </button>
              </div>
            </div>

            {/* Company Info */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Company Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Sector:</span>
                  <span className="ml-2 font-semibold">Banking</span>
                </div>
                <div>
                  <span className="text-gray-600">Industry:</span>
                  <span className="ml-2 font-semibold">Private Sector Bank</span>
                </div>
                <div>
                  <span className="text-gray-600">BSE Code:</span>
                  <span className="ml-2 font-semibold">500180</span>
                </div>
                <div>
                  <span className="text-gray-600">NSE Symbol:</span>
                  <span className="ml-2 font-semibold">{stock.symbol}</span>
                </div>
                <div>
                  <span className="text-gray-600">ISIN:</span>
                  <span className="ml-2 font-semibold">INE040A01034</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
