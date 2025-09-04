const RealPortfolio = require('../models/realPortfolio.model');
const realMarketDataService = require('../services/realMarketData');
const { validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// Place Real Order with actual money tracking
const placeRealOrder = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation Error', errors.array());
  }

  const { symbol, type, orderType, quantity, price, stopLoss, target } = req.body;
  const userId = req.user.id;

  try {
    console.log(`🔄 Processing ${type} order for ${symbol} - Quantity: ${quantity}`);

    // Get REAL market data
    const marketData = await realMarketDataService.getRealTimePrice(symbol);
    if (!marketData) {
      throw new ApiError(400, `Unable to fetch real market data for ${symbol}`);
    }

    console.log(`📊 Real Market Data for ${symbol}:`, {
      price: marketData.price,
      change: marketData.change,
      changePercent: marketData.changePercent,
      volume: marketData.volume,
      source: marketData.source
    });

    // Get or create user's REAL portfolio
    let portfolio = await RealPortfolio.findOne({ userId });
    if (!portfolio) {
      portfolio = new RealPortfolio({
        userId,
        accountBalance: 100000, // Starting balance ₹1,00,000
        totalInvested: 0,
        totalRealizedPnL: 0,
        holdings: [],
        tradingHistory: [],
        performance: {
          totalPortfolioValue: 100000,
          totalUnrealizedPnL: 0,
          totalUnrealizedPnLPercent: 0,
          dayPnL: 0,
          dayPnLPercent: 0
        }
      });
      await portfolio.save();
      console.log(`🆕 Created new REAL portfolio for user ${userId} with ₹1,00,000 starting balance`);
    }

    // Determine execution price
    let executionPrice;
    if (orderType === 'MARKET') {
      executionPrice = marketData.price;
      console.log(`📈 Market order - executing at current price: ₹${executionPrice}`);
    } else if (orderType === 'LIMIT') {
      if (!price) {
        throw new ApiError(400, 'Price is required for limit orders');
      }
      executionPrice = price;
      
      // For demo purposes, execute limit orders immediately if price is reasonable
      const priceBuffer = 0.05; // 5% buffer
      if (type === 'BUY' && price < marketData.price * (1 + priceBuffer)) {
        console.log(`✅ Limit BUY order acceptable - Price: ₹${price} vs Market: ₹${marketData.price}`);
      } else if (type === 'SELL' && price > marketData.price * (1 - priceBuffer)) {
        console.log(`✅ Limit SELL order acceptable - Price: ₹${price} vs Market: ₹${marketData.price}`);
      } else {
        throw new ApiError(400, `Limit order price ₹${price} is too far from market price ₹${marketData.price}`);
      }
    }

    // Calculate trading fees (realistic brokerage: ₹20 per order)
    const fees = 20;
    let orderResult;

    if (type === 'BUY') {
      // EXECUTE REAL BUY TRANSACTION
      console.log(`💰 Executing BUY: ${quantity} shares at ₹${executionPrice}`);
      console.log(`📊 Before transaction - Balance: ₹${portfolio.accountBalance}`);
      
      orderResult = portfolio.buyStock({
        symbol,
        companyName: `${symbol} Limited`, // In real implementation, fetch from market data
        quantity: parseInt(quantity),
        price: executionPrice,
        fees
      });
      
      console.log(`✅ BUY ORDER EXECUTED SUCCESSFULLY:`, {
        symbol,
        quantity: parseInt(quantity),
        price: executionPrice,
        totalCost: orderResult.totalCost,
        fees: orderResult.fees,
        remainingBalance: orderResult.remainingBalance,
        message: orderResult.message
      });

    } else if (type === 'SELL') {
      // EXECUTE REAL SELL TRANSACTION
      console.log(`💰 Executing SELL: ${quantity} shares at ₹${executionPrice}`);
      
      orderResult = portfolio.sellStock({
        symbol,
        quantity: parseInt(quantity),
        price: executionPrice,
        fees
      });
      
      console.log(`✅ SELL ORDER EXECUTED SUCCESSFULLY:`, {
        symbol,
        quantity: parseInt(quantity),
        price: executionPrice,
        saleValue: orderResult.saleValue,
        fees: orderResult.fees,
        realizedPnL: orderResult.realizedPnL,
        remainingShares: orderResult.remainingShares,
        currentBalance: orderResult.currentBalance,
        message: orderResult.message
      });
    }

    // Save portfolio changes to database
    await portfolio.save();
    console.log(`💾 Portfolio saved to database`);

    // Get updated comprehensive portfolio metrics
    const portfolioMetrics = portfolio.calculateComprehensiveMetrics();

    // Response with REAL trading results
    res.status(200).json(
      new ApiResponse(200, {
        success: true,
        execution: {
          orderId: orderResult.orderId,
          symbol,
          type,
          orderType,
          quantity: parseInt(quantity),
          executionPrice,
          status: 'EXECUTED',
          executedAt: new Date().toISOString(),
          fees,
          message: orderResult.message,
          realizedPnL: orderResult.realizedPnL || 0
        },
        portfolio: {
          accountBalance: portfolioMetrics.accountBalance,
          totalPortfolioValue: portfolioMetrics.totalPortfolioValue,
          totalInvested: portfolioMetrics.totalInvested,
          totalRealizedPnL: portfolioMetrics.totalRealizedPnL,
          totalUnrealizedPnL: portfolioMetrics.totalUnrealizedPnL,
          totalPnL: portfolioMetrics.totalPnL,
          totalPnLPercent: portfolioMetrics.totalPnLPercent,
          dayPnL: portfolioMetrics.dayPnL,
          dayPnLPercent: portfolioMetrics.dayPnLPercent,
          holdings: portfolioMetrics.holdings.map(holding => ({
            symbol: holding.symbol,
            companyName: holding.companyName,
            quantity: holding.quantity,
            averagePrice: holding.averagePrice,
            currentPrice: holding.currentPrice,
            invested: holding.invested,
            currentValue: holding.currentValue,
            unrealizedPnL: holding.unrealizedPnL,
            unrealizedPnLPercent: holding.unrealizedPnLPercent,
            dayPnL: holding.dayPnL,
            dayPnLPercent: holding.dayPnLPercent
          }))
        },
        marketData: {
          symbol,
          currentPrice: marketData.price,
          change: marketData.change,
          changePercent: marketData.changePercent,
          volume: marketData.volume,
          high: marketData.high,
          low: marketData.low,
          open: marketData.open,
          previousClose: marketData.previousClose,
          source: marketData.source,
          timestamp: marketData.timestamp
        }
      }, 'Real order executed successfully with actual money tracking')
    );

  } catch (error) {
    console.error('❌ REAL ORDER EXECUTION ERROR:', {
      message: error.message,
      symbol,
      type,
      quantity,
      userId
    });
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(500, `Real order execution failed: ${error.message}`);
  }
});

// Get Real Portfolio with current market prices
const getRealPortfolio = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    let portfolio = await RealPortfolio.findOne({ userId });
    
    if (!portfolio) {
      // Create default portfolio if doesn't exist
      portfolio = new RealPortfolio({
        userId,
        accountBalance: 100000,
        totalInvested: 0,
        totalRealizedPnL: 0,
        holdings: []
      });
      await portfolio.save();
    }

    // Update all holdings with current market prices
    if (portfolio.holdings.length > 0) {
      const symbols = portfolio.holdings.map(h => h.symbol);
      const marketData = await realMarketDataService.getMultipleStockPrices(symbols);
      portfolio.updateAllHoldingsWithMarketData(marketData);
      await portfolio.save();
    }

    const portfolioMetrics = portfolio.calculateComprehensiveMetrics();

    res.status(200).json(
      new ApiResponse(200, portfolioMetrics, 'Real portfolio retrieved successfully')
    );

  } catch (error) {
    console.error('❌ Get real portfolio error:', error.message);
    throw new ApiError(500, `Failed to get real portfolio: ${error.message}`);
  }
});

// Get Real Market Data
const getRealMarketData = asyncHandler(async (req, res) => {
  try {
    const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK', 'KOTAKBANK', 'BHARTIARTL', 'ITC', 'SBIN'];
    
    const marketData = await realMarketDataService.getMultipleStockPrices(symbols);
    const indices = await realMarketDataService.getMarketIndices();

    res.status(200).json(
      new ApiResponse(200, {
        stocks: marketData,
        indices: indices,
        timestamp: new Date().toISOString(),
        message: 'Real market data from Yahoo Finance and fallback simulation'
      }, 'Real market data retrieved successfully')
    );

  } catch (error) {
    console.error('❌ Get real market data error:', error.message);
    throw new ApiError(500, `Failed to get real market data: ${error.message}`);
  }
});

// Get Trading History
const getTradingHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const portfolio = await RealPortfolio.findOne({ userId });
    
    if (!portfolio) {
      return res.status(200).json(
        new ApiResponse(200, { trades: [] }, 'No trading history found')
      );
    }

    const recentTrades = portfolio.tradingHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50); // Last 50 trades

    res.status(200).json(
      new ApiResponse(200, {
        trades: recentTrades,
        totalTrades: portfolio.tradingHistory.length,
        totalRealizedPnL: portfolio.totalRealizedPnL
      }, 'Trading history retrieved successfully')
    );

  } catch (error) {
    console.error('❌ Get trading history error:', error.message);
    throw new ApiError(500, `Failed to get trading history: ${error.message}`);
  }
});

module.exports = {
  placeRealOrder,
  getRealPortfolio,
  getRealMarketData,
  getTradingHistory
};
