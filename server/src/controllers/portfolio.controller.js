const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const Portfolio = require('../models/portfolio.model');
const Transaction = require('../models/transaction.model');
const Order = require('../models/order.model');

// Get user portfolio
const getPortfolio = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  let portfolio = await Portfolio.findOne({ userId }).populate('holdings.symbol');

  if (!portfolio) {
    // Create new portfolio if doesn't exist
    portfolio = new Portfolio({
      userId,
      totalValue: 0,
      investedAmount: 0,
      totalPnL: 0,
      holdings: [],
      watchlist: []
    });
    await portfolio.save();
  }

  // Calculate real-time portfolio values
  await calculatePortfolioValues(portfolio, req.app.marketDataService);

  return res.status(200).json(
    new ApiResponse(200, portfolio, 'Portfolio retrieved successfully')
  );
});

// Add stock to portfolio (after order execution)
const addHolding = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { symbol, quantity, avgPrice, exchange = 'NSE' } = req.body;

  if (!symbol || !quantity || !avgPrice) {
    throw new ApiError(400, 'Symbol, quantity, and average price are required');
  }

  let portfolio = await Portfolio.findOne({ userId });
  
  if (!portfolio) {
    portfolio = new Portfolio({ userId });
  }

  // Check if holding already exists
  const existingHolding = portfolio.holdings.find(h => h.symbol === symbol);

  if (existingHolding) {
    // Update existing holding
    const totalQty = existingHolding.quantity + quantity;
    const totalValue = (existingHolding.quantity * existingHolding.avgPrice) + (quantity * avgPrice);
    
    existingHolding.quantity = totalQty;
    existingHolding.avgPrice = totalValue / totalQty;
    existingHolding.lastUpdated = new Date();
  } else {
    // Add new holding
    portfolio.holdings.push({
      symbol,
      quantity,
      avgPrice,
      exchange,
      addedDate: new Date(),
      lastUpdated: new Date()
    });
  }

  await portfolio.save();
  await calculatePortfolioValues(portfolio, req.app.marketDataService);

  return res.status(200).json(
    new ApiResponse(200, portfolio, 'Holding added successfully')
  );
});

// Remove/Reduce holding from portfolio
const removeHolding = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { symbol, quantity } = req.body;

  if (!symbol || !quantity) {
    throw new ApiError(400, 'Symbol and quantity are required');
  }

  const portfolio = await Portfolio.findOne({ userId });
  
  if (!portfolio) {
    throw new ApiError(404, 'Portfolio not found');
  }

  const holdingIndex = portfolio.holdings.findIndex(h => h.symbol === symbol);
  
  if (holdingIndex === -1) {
    throw new ApiError(404, 'Holding not found in portfolio');
  }

  const holding = portfolio.holdings[holdingIndex];

  if (holding.quantity <= quantity) {
    // Remove holding completely
    portfolio.holdings.splice(holdingIndex, 1);
  } else {
    // Reduce quantity
    holding.quantity -= quantity;
    holding.lastUpdated = new Date();
  }

  await portfolio.save();
  await calculatePortfolioValues(portfolio, req.app.marketDataService);

  return res.status(200).json(
    new ApiResponse(200, portfolio, 'Holding updated successfully')
  );
});

// Get portfolio analytics
const getPortfolioAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const portfolio = await Portfolio.findOne({ userId });
  
  if (!portfolio) {
    throw new ApiError(404, 'Portfolio not found');
  }

  // Get transactions for analytics
  const transactions = await Transaction.find({ userId })
    .sort({ executionTime: -1 })
    .limit(100);

  // Calculate analytics
  const analytics = {
    totalInvestment: portfolio.investedAmount || 0,
    currentValue: portfolio.totalValue || 0,
    totalPnL: portfolio.totalPnL || 0,
    pnlPercentage: portfolio.investedAmount ? 
      ((portfolio.totalPnL / portfolio.investedAmount) * 100).toFixed(2) : 0,
    
    // Holdings distribution
    holdingsCount: portfolio.holdings.length,
    sectorDistribution: calculateSectorDistribution(portfolio.holdings),
    
    // Performance metrics
    daysPnL: calculateDaysPnL(portfolio.holdings, req.app.marketDataService),
    topGainers: getTopPerformers(portfolio.holdings, req.app.marketDataService, 'gainers'),
    topLosers: getTopPerformers(portfolio.holdings, req.app.marketDataService, 'losers'),
    
    // Transaction summary
    totalTransactions: transactions.length,
    recentTransactions: transactions.slice(0, 5),
    
    // Portfolio composition
    composition: portfolio.holdings.map(holding => {
      const currentPrice = req.app.marketDataService.getCurrentPrice(holding.symbol) || holding.avgPrice;
      const currentValue = holding.quantity * currentPrice;
      const totalPortfolioValue = portfolio.totalValue || 1;
      
      return {
        symbol: holding.symbol,
        percentage: ((currentValue / totalPortfolioValue) * 100).toFixed(2),
        value: currentValue,
        quantity: holding.quantity
      };
    })
  };

  return res.status(200).json(
    new ApiResponse(200, analytics, 'Portfolio analytics retrieved successfully')
  );
});

// Add stock to watchlist
const addToWatchlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { symbol, exchange = 'NSE' } = req.body;

  if (!symbol) {
    throw new ApiError(400, 'Symbol is required');
  }

  let portfolio = await Portfolio.findOne({ userId });
  
  if (!portfolio) {
    portfolio = new Portfolio({ userId });
  }

  // Check if already in watchlist
  const exists = portfolio.watchlist.some(item => item.symbol === symbol);
  
  if (exists) {
    throw new ApiError(400, 'Symbol already in watchlist');
  }

  portfolio.watchlist.push({
    symbol,
    exchange,
    addedDate: new Date()
  });

  await portfolio.save();

  return res.status(200).json(
    new ApiResponse(200, portfolio.watchlist, 'Added to watchlist successfully')
  );
});

// Remove from watchlist
const removeFromWatchlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { symbol } = req.params;

  const portfolio = await Portfolio.findOne({ userId });
  
  if (!portfolio) {
    throw new ApiError(404, 'Portfolio not found');
  }

  portfolio.watchlist = portfolio.watchlist.filter(item => item.symbol !== symbol);
  await portfolio.save();

  return res.status(200).json(
    new ApiResponse(200, portfolio.watchlist, 'Removed from watchlist successfully')
  );
});

// Get watchlist with real-time prices
const getWatchlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const portfolio = await Portfolio.findOne({ userId });
  
  if (!portfolio) {
    return res.status(200).json(
      new ApiResponse(200, [], 'Watchlist is empty')
    );
  }

  // Enrich watchlist with real-time data
  const enrichedWatchlist = portfolio.watchlist.map(item => {
    const marketData = req.app.marketDataService.getMarketData([item.symbol])[0];
    
    return {
      ...item.toObject(),
      currentPrice: marketData?.price || 0,
      change: marketData?.change || 0,
      changePercent: marketData?.changePercent || 0,
      volume: marketData?.volume || 0,
      lastUpdated: marketData?.lastUpdated || Date.now()
    };
  });

  return res.status(200).json(
    new ApiResponse(200, enrichedWatchlist, 'Watchlist retrieved successfully')
  );
});

// Helper functions
async function calculatePortfolioValues(portfolio, marketDataService) {
  let totalValue = 0;
  let investedAmount = 0;
  let totalPnL = 0;

  for (let holding of portfolio.holdings) {
    const currentPrice = marketDataService.getCurrentPrice(holding.symbol) || holding.avgPrice;
    const currentValue = holding.quantity * currentPrice;
    const investedValue = holding.quantity * holding.avgPrice;
    const pnl = currentValue - investedValue;

    // Update holding values
    holding.currentPrice = currentPrice;
    holding.currentValue = currentValue;
    holding.pnl = pnl;
    holding.pnlPercentage = ((pnl / investedValue) * 100).toFixed(2);

    totalValue += currentValue;
    investedAmount += investedValue;
    totalPnL += pnl;
  }

  // Update portfolio totals
  portfolio.totalValue = totalValue;
  portfolio.investedAmount = investedAmount;
  portfolio.totalPnL = totalPnL;
  portfolio.pnlPercentage = investedAmount ? ((totalPnL / investedAmount) * 100).toFixed(2) : 0;
  portfolio.lastUpdated = new Date();

  await portfolio.save();
}

function calculateSectorDistribution(holdings) {
  // Simplified sector mapping (in real app, you'd have a proper database)
  const sectorMap = {
    'RELIANCE': 'Energy',
    'TCS': 'Technology',
    'HDFCBANK': 'Banking',
    'INFY': 'Technology',
    'HINDUNILVR': 'FMCG',
    'ICICIBANK': 'Banking',
    'KOTAKBANK': 'Banking',
    'BHARTIARTL': 'Telecom',
    'ITC': 'FMCG',
    'SBIN': 'Banking',
    'BAJFINANCE': 'Financial Services',
    'ASIANPAINT': 'Paints',
    'DMART': 'Retail',
    'LTIM': 'Technology',
    'TITAN': 'Consumer Goods'
  };

  const distribution = {};
  
  holdings.forEach(holding => {
    const sector = sectorMap[holding.symbol] || 'Others';
    distribution[sector] = (distribution[sector] || 0) + (holding.currentValue || 0);
  });

  return distribution;
}

function calculateDaysPnL(holdings, marketDataService) {
  let daysPnL = 0;
  
  holdings.forEach(holding => {
    const marketData = marketDataService.getMarketData([holding.symbol])[0];
    if (marketData && marketData.change) {
      daysPnL += (marketData.change * holding.quantity);
    }
  });

  return daysPnL;
}

function getTopPerformers(holdings, marketDataService, type) {
  const performers = holdings.map(holding => {
    const marketData = marketDataService.getMarketData([holding.symbol])[0];
    return {
      symbol: holding.symbol,
      quantity: holding.quantity,
      changePercent: marketData?.changePercent || 0,
      pnl: holding.pnl || 0
    };
  });

  if (type === 'gainers') {
    return performers
      .filter(p => p.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);
  } else {
    return performers
      .filter(p => p.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);
  }
}

module.exports = {
  getPortfolio,
  addHolding,
  removeHolding,
  getPortfolioAnalytics,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist
};
