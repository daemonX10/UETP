const express = require('express');
const router = express.Router();

// Import controllers
const {
  getPortfolio,
  addHolding,
  removeHolding,
  getPortfolioAnalytics,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist
} = require('../controllers/portfolio.controller');

// Import middleware
const auth = require('../middlewares/auth');

// All routes require authentication
router.use(auth);

// Portfolio routes
router.get('/', getPortfolio);
router.post('/holdings/add', addHolding);
router.post('/holdings/remove', removeHolding);
router.get('/analytics', getPortfolioAnalytics);

// Watchlist routes
router.get('/watchlist', getWatchlist);
router.post('/watchlist/add', addToWatchlist);
router.delete('/watchlist/:symbol', removeFromWatchlist);

module.exports = router;
