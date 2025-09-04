const express = require('express');
const router = express.Router();

// Import controllers
const {
  getMarketData,
  getCurrentPrice,
  getMarketSnapshot,
  getMarketIndices,
  getTopGainers,
  getTopLosers,
  getMostActive,
  searchStocks
} = require('../controllers/market.controller');

// Public routes (no authentication required for market data)
router.get('/data', getMarketData);
router.get('/price/:symbol', getCurrentPrice);
router.get('/snapshot', getMarketSnapshot);
router.get('/indices', getMarketIndices);
router.get('/gainers', getTopGainers);
router.get('/losers', getTopLosers);
router.get('/active', getMostActive);
router.get('/search', searchStocks);

module.exports = router;
