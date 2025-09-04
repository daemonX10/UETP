"use client";

import React, { useState } from "react";
import Link from "next/link";

// Mock data for dashboard
const portfolioData = {
  totalValue: 250000,
  todayPnL: 3500,
  todayPnLPercent: 1.42,
  totalPnL: 25000,
  totalPnLPercent: 11.11,
  invested: 225000,
};

const holdings = [
  { symbol: "HDFCBANK", name: "HDFC Bank", qty: 100, avgPrice: 1500, currentPrice: 1630.5, pnl: 13050, pnlPercent: 8.7 },
  { symbol: "RELIANCE", name: "Reliance Industries", qty: 50, avgPrice: 2400, currentPrice: 2450.8, pnl: 2540, pnlPercent: 2.12 },
  { symbol: "INFY", name: "Infosys", qty: 150, avgPrice: 1400, currentPrice: 1450.2, pnl: 7530, pnlPercent: 3.59 },
  { symbol: "TCS", name: "Tata Consultancy Services", qty: 25, avgPrice: 3400, currentPrice: 3500.1, pnl: 2502.5, pnlPercent: 2.94 },
];

const watchlist = [
  { symbol: "ICICIBANK", name: "ICICI Bank", price: 950.75, change: 1.8 },
  { symbol: "SBIN", name: "State Bank of India", price: 610.3, change: -1.5 },
  { symbol: "WIPRO", name: "Wipro Limited", price: 420.5, change: -0.3 },
  { symbol: "ONGC", name: "Oil & Natural Gas Corp", price: 180.2, change: -0.7 },
];

const recentTransactions = [
  { type: "BUY", symbol: "HDFCBANK", qty: 25, price: 1625.0, date: "2025-09-04", time: "14:30" },
  { type: "SELL", symbol: "RELIANCE", qty: 10, price: 2460.0, date: "2025-09-04", time: "11:15" },
  { type: "BUY", symbol: "INFY", qty: 50, price: 1445.0, date: "2025-09-03", time: "15:45" },
];

function PortfolioOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{portfolioData.totalValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Today's P&L</p>
            <p className={`text-2xl font-bold ${portfolioData.todayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioData.todayPnL >= 0 ? '+' : ''}₹{Math.abs(portfolioData.todayPnL).toLocaleString()}
            </p>
            <p className={`text-sm ${portfolioData.todayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioData.todayPnL >= 0 ? '+' : ''}{portfolioData.todayPnLPercent}%
            </p>
          </div>
          <div className={`p-3 rounded-full ${portfolioData.todayPnL >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <svg className={`w-6 h-6 ${portfolioData.todayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total P&L</p>
            <p className={`text-2xl font-bold ${portfolioData.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioData.totalPnL >= 0 ? '+' : ''}₹{Math.abs(portfolioData.totalPnL).toLocaleString()}
            </p>
            <p className={`text-sm ${portfolioData.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioData.totalPnL >= 0 ? '+' : ''}{portfolioData.totalPnLPercent}%
            </p>
          </div>
          <div className={`p-3 rounded-full ${portfolioData.totalPnL >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <svg className={`w-6 h-6 ${portfolioData.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Invested</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{portfolioData.invested.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-100 p-3 rounded-full">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function HoldingsTable() {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Holdings</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {holdings.map((holding) => (
              <tr key={holding.symbol} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <Link href={`/stock/${holding.symbol}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {holding.symbol}
                    </Link>
                    <div className="text-sm text-gray-500">{holding.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {holding.qty}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{holding.avgPrice.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{holding.currentPrice.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {holding.pnl >= 0 ? '+' : ''}₹{Math.abs(holding.pnl).toFixed(2)}
                  </div>
                  <div className={`text-xs ${holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {holding.pnl >= 0 ? '+' : ''}{holding.pnlPercent}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-green-600 hover:text-green-900 mr-3">Buy</button>
                  <button className="text-red-600 hover:text-red-900">Sell</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WatchlistCard() {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Watchlist</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {watchlist.map((stock) => (
            <div key={stock.symbol} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div>
                <Link href={`/stock/${stock.symbol}`} className="font-medium text-blue-600 hover:text-blue-800">
                  {stock.symbol}
                </Link>
                <div className="text-sm text-gray-500">{stock.name}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">₹{stock.price.toFixed(2)}</div>
                <div className={`text-sm ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stock.change >= 0 ? '+' : ''}{stock.change}%
                </div>
              </div>
            </div>
          ))}
        </div>
        <Link href="/watchlist" className="block text-center text-blue-600 hover:text-blue-800 font-medium mt-4">
          View All →
        </Link>
      </div>
    </div>
  );
}

function RecentTransactions() {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {recentTransactions.map((transaction, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center">
                <span className={`px-2 py-1 rounded text-xs font-medium mr-3 ${
                  transaction.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {transaction.type}
                </span>
                <div>
                  <div className="font-medium">{transaction.symbol}</div>
                  <div className="text-sm text-gray-500">{transaction.qty} shares</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">₹{transaction.price.toFixed(2)}</div>
                <div className="text-sm text-gray-500">{transaction.date} {transaction.time}</div>
              </div>
            </div>
          ))}
        </div>
        <Link href="/orders" className="block text-center text-blue-600 hover:text-blue-800 font-medium mt-4">
          View All Orders →
        </Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
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
                <span className="text-blue-600 font-medium">Dashboard</span>
                <Link href="/markets" className="text-gray-700 hover:text-blue-800">Markets</Link>
                <Link href="/watchlist" className="text-gray-700 hover:text-blue-800">Watchlist</Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Market: <span className="text-green-600 font-semibold">OPEN</span>
              </div>
              <div className="text-sm text-gray-900 font-medium">Welcome, Trader</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Portfolio Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor your investments and track market performance</p>
        </div>

        {/* Portfolio Overview */}
        <PortfolioOverview />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Holdings Table */}
          <div className="lg:col-span-2">
            <HoldingsTable />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <WatchlistCard />
            <RecentTransactions />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/buy" className="bg-green-600 text-white text-center py-3 px-4 rounded-lg hover:bg-green-700 font-medium">
              Place Buy Order
            </Link>
            <Link href="/sell" className="bg-red-600 text-white text-center py-3 px-4 rounded-lg hover:bg-red-700 font-medium">
              Place Sell Order
            </Link>
            <Link href="/sip" className="bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 font-medium">
              Start SIP
            </Link>
            <Link href="/reports" className="bg-gray-600 text-white text-center py-3 px-4 rounded-lg hover:bg-gray-700 font-medium">
              View Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}