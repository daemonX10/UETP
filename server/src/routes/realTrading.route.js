const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middlewares/auth');
const {
  placeRealOrder,
  getRealPortfolio,
  getRealMarketData,
  getTradingHistory
} = require('../controllers/realTrading.controller');

// Validation middleware for order placement
const orderValidation = [
  body('symbol')
    .notEmpty()
    .withMessage('Symbol is required')
    .isLength({ min: 2, max: 10 })
    .withMessage('Symbol must be between 2-10 characters')
    .isAlpha()
    .withMessage('Symbol must contain only letters'),
  
  body('type')
    .isIn(['BUY', 'SELL'])
    .withMessage('Type must be either BUY or SELL'),
  
  body('orderType')
    .isIn(['MARKET', 'LIMIT'])
    .withMessage('Order type must be either MARKET or LIMIT'),
  
  body('quantity')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Quantity must be a positive integer between 1 and 10000'),
  
  body('price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number greater than 0.01'),
  
  body('stopLoss')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Stop loss must be a positive number'),
  
  body('target')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Target must be a positive number')
];

// REAL TRADING ROUTES

// Place real order with actual money tracking
router.post('/real-order', auth, orderValidation, placeRealOrder);

// Get real portfolio with current market values
router.get('/real-portfolio', auth, getRealPortfolio);

// Get real market data from live sources
router.get('/real-market-data', getRealMarketData);

// Get trading history with P&L tracking
router.get('/trading-history', auth, getTradingHistory);

// Real-time stock price endpoint
router.get('/real-price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const realMarketDataService = require('../services/realMarketData');
    
    const marketData = await realMarketDataService.getRealTimePrice(symbol.toUpperCase());
    
    if (!marketData) {
      return res.status(404).json({
        success: false,
        message: `Market data not found for ${symbol}`
      });
    }

    res.status(200).json({
      success: true,
      data: marketData,
      message: 'Real-time price retrieved successfully'
    });

  } catch (error) {
    console.error('Real price fetch error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch real-time price',
      error: error.message
    });
  }
});

// Market indices endpoint
router.get('/indices', async (req, res) => {
  try {
    const realMarketDataService = require('../services/realMarketData');
    const indices = await realMarketDataService.getMarketIndices();

    res.status(200).json({
      success: true,
      data: indices,
      message: 'Market indices retrieved successfully'
    });

  } catch (error) {
    console.error('Indices fetch error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market indices',
      error: error.message
    });
  }
});

module.exports = router;
