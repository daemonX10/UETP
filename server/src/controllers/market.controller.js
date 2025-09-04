const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

// Get current market data for specific symbols
const getMarketData = asyncHandler(async (req, res) => {
  const { symbols } = req.query;
  const symbolArray = symbols ? symbols.split(',') : [];

  // Get market data from the global market service
  const marketData = req.app.marketDataService.getMarketData(symbolArray);

  return res.status(200).json(
    new ApiResponse(200, marketData, 'Market data retrieved successfully')
  );
});

// Get current price for a specific symbol
const getCurrentPrice = asyncHandler(async (req, res) => {
  const { symbol } = req.params;

  if (!symbol) {
    throw new ApiError(400, 'Symbol is required');
  }

  const price = req.app.marketDataService.getCurrentPrice(symbol.toUpperCase());

  if (price === null) {
    throw new ApiError(404, `Price not found for symbol: ${symbol}`);
  }

  return res.status(200).json(
    new ApiResponse(200, { symbol: symbol.toUpperCase(), price }, 'Current price retrieved successfully')
  );
});

// Get market snapshot (all available data)
const getMarketSnapshot = asyncHandler(async (req, res) => {
  const snapshot = req.app.marketDataService.getMarketSnapshot();

  return res.status(200).json(
    new ApiResponse(200, snapshot, 'Market snapshot retrieved successfully')
  );
});

// Get market indices data
const getMarketIndices = asyncHandler(async (req, res) => {
  // Simulated indices data
  const indices = {
    NIFTY50: {
      name: 'NIFTY 50',
      value: 19845.25,
      change: 125.80,
      changePercent: 0.64,
      lastUpdated: Date.now()
    },
    SENSEX: {
      name: 'BSE SENSEX',
      value: 66795.14,
      change: 423.54,
      changePercent: 0.64,
      lastUpdated: Date.now()
    },
    BANKNIFTY: {
      name: 'BANK NIFTY',
      value: 44128.75,
      change: -245.30,
      changePercent: -0.55,
      lastUpdated: Date.now()
    },
    NIFTYIT: {
      name: 'NIFTY IT',
      value: 31245.60,
      change: 185.90,
      changePercent: 0.60,
      lastUpdated: Date.now()
    }
  };

  return res.status(200).json(
    new ApiResponse(200, indices, 'Market indices retrieved successfully')
  );
});

// Get top gainers
const getTopGainers = asyncHandler(async (req, res) => {
  const allData = req.app.marketDataService.getMarketData();
  
  // Sort by change percentage (descending) and take top 10
  const topGainers = allData
    .filter(stock => stock.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 10);

  return res.status(200).json(
    new ApiResponse(200, topGainers, 'Top gainers retrieved successfully')
  );
});

// Get top losers
const getTopLosers = asyncHandler(async (req, res) => {
  const allData = req.app.marketDataService.getMarketData();
  
  // Sort by change percentage (ascending) and take top 10
  const topLosers = allData
    .filter(stock => stock.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 10);

  return res.status(200).json(
    new ApiResponse(200, topLosers, 'Top losers retrieved successfully')
  );
});

// Get most active stocks by volume
const getMostActive = asyncHandler(async (req, res) => {
  const allData = req.app.marketDataService.getMarketData();
  
  // Sort by volume (descending) and take top 10
  const mostActive = allData
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);

  return res.status(200).json(
    new ApiResponse(200, mostActive, 'Most active stocks retrieved successfully')
  );
});

// Search stocks by symbol or name
const searchStocks = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query || query.length < 2) {
    throw new ApiError(400, 'Search query must be at least 2 characters');
  }

  const allData = req.app.marketDataService.getMarketData();
  
  // Simple search by symbol (in real app, you'd search a comprehensive database)
  const searchResults = allData.filter(stock => 
    stock.symbol.toLowerCase().includes(query.toLowerCase())
  );

  return res.status(200).json(
    new ApiResponse(200, searchResults, 'Search results retrieved successfully')
  );
});

module.exports = {
  getMarketData,
  getCurrentPrice,
  getMarketSnapshot,
  getMarketIndices,
  getTopGainers,
  getTopLosers,
  getMostActive,
  searchStocks
};
