"use client";

import React, { useState } from "react";
import Link from "next/link";

// Mock data for demonstration
const featuredStocks = [
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1630.5, change: 1.2, volume: "2.4M", marketCap: "₹8.9L Cr" },
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2450.8, change: -0.8, volume: "1.8M", marketCap: "₹16.5L Cr" },
  { symbol: "INFY", name: "Infosys", price: 1450.2, change: 0.5, volume: "3.2M", marketCap: "₹6.1L Cr" },
  { symbol: "TCS", name: "Tata Consultancy Services", price: 3500.1, change: 2.1, volume: "1.5M", marketCap: "₹12.8L Cr" },
  { symbol: "ICICIBANK", name: "ICICI Bank", price: 950.75, change: 1.8, volume: "4.1M", marketCap: "₹6.7L Cr" },
  { symbol: "SBIN", name: "State Bank of India", price: 610.3, change: -1.5, volume: "5.2M", marketCap: "₹5.4L Cr" },
];

const topGainers = [
  { symbol: "HDFCBANK", change: 1.2, price: 1630.5 },
  { symbol: "TCS", change: 2.1, price: 3500.1 },
  { symbol: "ICICIBANK", change: 1.8, price: 950.75 },
  { symbol: "INFY", change: 0.5, price: 1450.2 },
];

const topLosers = [
  { symbol: "SBIN", change: -1.5, price: 610.3 },
  { symbol: "RELIANCE", change: -0.8, price: 2450.8 },
  { symbol: "WIPRO", change: -0.3, price: 420.5 },
  { symbol: "ONGC", change: -0.7, price: 180.2 },
];

const indices = [
  { name: "NIFTY 50", value: 19800.25, change: 0.45, points: 89.5 },
  { name: "SENSEX", value: 66500.10, change: 0.38, points: 251.2 },
  { name: "BANK NIFTY", value: 44250.75, change: 0.62, points: 273.8 },
  { name: "NIFTY IT", value: 29100.30, change: 1.12, points: 322.1 },
];

const sectors = [
  { name: "Banking", change: 0.8, color: "text-green-600" },
  { name: "IT", change: 1.2, color: "text-green-600" },
  { name: "Pharma", change: -0.3, color: "text-red-600" },
  { name: "Auto", change: 0.5, color: "text-green-600" },
  { name: "FMCG", change: -0.1, color: "text-red-600" },
  { name: "Metals", change: 1.8, color: "text-green-600" },
];

function StockSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  
  const filtered = featuredStocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <input
          type="text"
          className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Search stocks, indices..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      {query && isOpen && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
          {filtered.length ? (
            filtered.map((stock) => (
              <Link
                key={stock.symbol}
                href={`/stock/${stock.symbol}`}
                className="block px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-900">{stock.symbol}</div>
                    <div className="text-sm text-gray-600">{stock.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">₹{stock.price.toFixed(2)}</div>
                    <div className={`text-sm ${stock.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {stock.change >= 0 ? "+" : ""}{stock.change}%
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-4 py-3 text-gray-500 text-center">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}

function StockCard({ stock }: { stock: any }) {
  return (
    <Link href={`/stock/${stock.symbol}`}>
      <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{stock.symbol}</h3>
            <p className="text-sm text-gray-600 truncate">{stock.name}</p>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            stock.change >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {stock.change >= 0 ? "+" : ""}{stock.change}%
          </div>
        </div>
        
        <div className="mb-3">
          <div className={`text-2xl font-bold ${stock.change >= 0 ? "text-green-600" : "text-red-600"}`}>
            ₹{stock.price.toFixed(2)}
          </div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-600">
          <span>Vol: {stock.volume}</span>
          <span>MCap: {stock.marketCap}</span>
        </div>
      </div>
    </Link>
  );
}

function IndexCard({ index }: { index: any }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{index.name}</h3>
          <div className="text-2xl font-bold text-gray-900">
            {index.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-semibold ${index.change >= 0 ? "text-green-600" : "text-red-600"}`}>
            {index.change >= 0 ? "+" : ""}{index.change}%
          </div>
          <div className={`text-sm ${index.change >= 0 ? "text-green-600" : "text-red-600"}`}>
            {index.change >= 0 ? "+" : ""}{index.points.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-700">TradeDash</h1>
              <span className="ml-2 text-sm text-gray-500">NSE/BSE Stock Trading Platform</span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">Home</Link>
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-800">Dashboard</Link>
              <Link href="/markets" className="text-gray-700 hover:text-blue-800">Markets</Link>
              <Link href="/watchlist" className="text-gray-700 hover:text-blue-800">Watchlist</Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Market: <span className="text-green-600 font-semibold">OPEN</span>
              </div>
              <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Real-time Stock Market Data</h2>
          <p className="text-xl mb-8 text-blue-100">Track NSE & BSE stocks with live prices, charts, and analysis</p>
          <StockSearch />
        </div>
      </section>

      {/* Market Indices */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Market Indices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {indices.map((index) => (
            <IndexCard key={index.name} index={index} />
          ))}
        </div>
      </section>

      {/* Featured Stocks */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Stocks</h2>
          <Link href="/markets" className="text-blue-600 hover:text-blue-800 font-medium">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredStocks.slice(0, 6).map((stock) => (
            <StockCard key={stock.symbol} stock={stock} />
          ))}
        </div>
      </section>

      {/* Top Gainers & Losers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Gainers */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Top Gainers
            </h3>
            <div className="space-y-3">
              {topGainers.map((stock) => (
                <div key={stock.symbol} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="font-semibold text-gray-900">{stock.symbol}</span>
                  <div className="text-right">
                    <div className="font-semibold">₹{stock.price.toFixed(2)}</div>
                    <div className="text-green-600 text-sm">+{stock.change}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Top Losers
            </h3>
            <div className="space-y-3">
              {topLosers.map((stock) => (
                <div key={stock.symbol} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="font-semibold text-gray-900">{stock.symbol}</span>
                  <div className="text-right">
                    <div className="font-semibold">₹{stock.price.toFixed(2)}</div>
                    <div className="text-red-600 text-sm">{stock.change}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sector Performance */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Sector Performance</h2>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {sectors.map((sector) => (
              <div key={sector.name} className="text-center p-4 rounded-lg bg-gray-50">
                <div className="font-semibold text-gray-900 mb-1">{sector.name}</div>
                <div className={`text-lg font-bold ${sector.color}`}>
                  {sector.change >= 0 ? "+" : ""}{sector.change}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">TradeDash</h3>
              <p className="text-gray-400">Your comprehensive stock trading platform for NSE & BSE markets.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Markets</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/nse" className="hover:text-white">NSE</Link></li>
                <li><Link href="/bse" className="hover:text-white">BSE</Link></li>
                <li><Link href="/indices" className="hover:text-white">Indices</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Tools</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/screener" className="hover:text-white">Stock Screener</Link></li>
                <li><Link href="/calculator" className="hover:text-white">SIP Calculator</Link></li>
                <li><Link href="/charts" className="hover:text-white">Charts</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/api" className="hover:text-white">API Docs</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 TradeDash. Powered by Upstox API. Market data is for informational purposes only.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
