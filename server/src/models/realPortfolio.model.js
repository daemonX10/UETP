const mongoose = require('mongoose');

// Real Trading Portfolio Schema with actual money tracking
const realPortfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Account Balance Management (Real money tracking)
  accountBalance: {
    type: Number,
    default: 100000, // Starting with ₹1,00,000 virtual money
    required: true,
    min: 0
  },
  
  totalInvested: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalRealizedPnL: {
    type: Number,
    default: 0
  },
  
  // Real Stock Holdings with proper tracking
  holdings: [{
    symbol: {
      type: String,
      required: true
    },
    companyName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    averagePrice: {
      type: Number,
      required: true,
      min: 0
    },
    currentPrice: {
      type: Number,
      default: 0
    },
    invested: {
      type: Number,
      required: true // quantity * averagePrice
    },
    currentValue: {
      type: Number,
      default: 0 // quantity * currentPrice
    },
    unrealizedPnL: {
      type: Number,
      default: 0 // currentValue - invested
    },
    unrealizedPnLPercent: {
      type: Number,
      default: 0
    },
    dayPnL: {
      type: Number,
      default: 0
    },
    dayPnLPercent: {
      type: Number,
      default: 0
    },
    purchaseDate: {
      type: Date,
      default: Date.now
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Trading Activity Log
  tradingHistory: [{
    orderId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true
    },
    symbol: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    fees: {
      type: Number,
      default: 20
    },
    realizedPnL: {
      type: Number,
      default: 0
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Performance Metrics
  performance: {
    totalPortfolioValue: {
      type: Number,
      default: 0
    },
    totalUnrealizedPnL: {
      type: Number,
      default: 0
    },
    totalUnrealizedPnLPercent: {
      type: Number,
      default: 0
    },
    dayPnL: {
      type: Number,
      default: 0
    },
    dayPnLPercent: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// REAL TRADING METHODS

// Calculate portfolio value
realPortfolioSchema.methods.calculatePortfolioValue = function() {
  const holdingsValue = this.holdings.reduce((total, holding) => {
    return total + holding.currentValue;
  }, 0);
  
  this.performance.totalPortfolioValue = this.accountBalance + holdingsValue;
  return this.performance.totalPortfolioValue;
};

// Update holding with current market price
realPortfolioSchema.methods.updateHoldingPrice = function(symbol, currentPrice, previousClose) {
  const holding = this.holdings.find(h => h.symbol === symbol);
  if (holding) {
    const previousCurrentPrice = holding.currentPrice || holding.averagePrice;
    
    holding.currentPrice = currentPrice;
    holding.currentValue = holding.quantity * currentPrice;
    holding.unrealizedPnL = holding.currentValue - holding.invested;
    holding.unrealizedPnLPercent = ((holding.unrealizedPnL / holding.invested) * 100);
    
    // Calculate day P&L
    holding.dayPnL = holding.quantity * (currentPrice - previousCurrentPrice);
    holding.dayPnLPercent = previousCurrentPrice > 0 ? 
      ((currentPrice - previousCurrentPrice) / previousCurrentPrice) * 100 : 0;
    
    holding.lastUpdated = new Date();
    
    return true;
  }
  return false;
};

// REAL BUY TRANSACTION
realPortfolioSchema.methods.buyStock = function(orderData) {
  const { symbol, companyName, quantity, price, fees = 20 } = orderData;
  const totalCost = (quantity * price) + fees;
  
  // Check if sufficient balance
  if (this.accountBalance < totalCost) {
    throw new Error(`Insufficient balance. Required: ₹${totalCost.toFixed(2)}, Available: ₹${this.accountBalance.toFixed(2)}`);
  }
  
  // Generate order ID
  const orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  // Deduct from account balance
  this.accountBalance -= totalCost;
  this.totalInvested += (quantity * price);
  
  // Find existing holding or create new
  const existingHolding = this.holdings.find(h => h.symbol === symbol);
  
  if (existingHolding) {
    // Update existing holding - calculate new average price
    const totalQuantity = existingHolding.quantity + quantity;
    const totalInvested = existingHolding.invested + (quantity * price);
    const newAveragePrice = totalInvested / totalQuantity;
    
    existingHolding.quantity = totalQuantity;
    existingHolding.averagePrice = newAveragePrice;
    existingHolding.invested = totalInvested;
    existingHolding.currentPrice = price;
    existingHolding.currentValue = totalQuantity * price;
    existingHolding.unrealizedPnL = existingHolding.currentValue - existingHolding.invested;
    existingHolding.unrealizedPnLPercent = (existingHolding.unrealizedPnL / existingHolding.invested) * 100;
    existingHolding.lastUpdated = new Date();
  } else {
    // Create new holding
    this.holdings.push({
      symbol,
      companyName,
      quantity,
      averagePrice: price,
      currentPrice: price,
      invested: quantity * price,
      currentValue: quantity * price,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      dayPnL: 0,
      dayPnLPercent: 0,
      purchaseDate: new Date(),
      lastUpdated: new Date()
    });
  }
  
  // Add to trading history
  this.tradingHistory.push({
    orderId,
    type: 'BUY',
    symbol,
    quantity,
    price,
    totalAmount: quantity * price,
    fees,
    realizedPnL: 0,
    timestamp: new Date()
  });
  
  // Update portfolio metrics
  this.calculatePortfolioValue();
  
  return {
    success: true,
    orderId,
    message: `Successfully bought ${quantity} shares of ${symbol} at ₹${price}`,
    totalCost,
    fees,
    remainingBalance: this.accountBalance,
    newHolding: existingHolding || this.holdings[this.holdings.length - 1]
  };
};

// REAL SELL TRANSACTION
realPortfolioSchema.methods.sellStock = function(orderData) {
  const { symbol, quantity, price, fees = 20 } = orderData;
  const holding = this.holdings.find(h => h.symbol === symbol);
  
  if (!holding) {
    throw new Error('No holdings found for this stock');
  }
  
  if (holding.quantity < quantity) {
    throw new Error(`Insufficient shares. You only have ${holding.quantity} shares`);
  }
  
  // Generate order ID
  const orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  const saleValue = (quantity * price) - fees;
  const costBasis = (quantity / holding.quantity) * holding.invested;
  const realizedPnL = saleValue - costBasis;
  
  // Add to account balance
  this.accountBalance += saleValue;
  this.totalRealizedPnL += realizedPnL;
  
  // Update holding
  if (holding.quantity === quantity) {
    // Sell all shares - remove holding
    this.holdings = this.holdings.filter(h => h.symbol !== symbol);
  } else {
    // Partial sell
    const remainingQuantity = holding.quantity - quantity;
    const remainingInvested = holding.invested - costBasis;
    
    holding.quantity = remainingQuantity;
    holding.invested = remainingInvested;
    holding.averagePrice = remainingInvested / remainingQuantity;
    holding.currentValue = remainingQuantity * price;
    holding.unrealizedPnL = holding.currentValue - holding.invested;
    holding.unrealizedPnLPercent = (holding.unrealizedPnL / holding.invested) * 100;
    holding.lastUpdated = new Date();
  }
  
  // Add to trading history
  this.tradingHistory.push({
    orderId,
    type: 'SELL',
    symbol,
    quantity,
    price,
    totalAmount: quantity * price,
    fees,
    realizedPnL,
    timestamp: new Date()
  });
  
  // Update portfolio metrics
  this.calculatePortfolioValue();
  
  return {
    success: true,
    orderId,
    message: `Successfully sold ${quantity} shares of ${symbol} at ₹${price}`,
    saleValue,
    fees,
    realizedPnL,
    remainingShares: holding ? holding.quantity : 0,
    currentBalance: this.accountBalance
  };
};

// Calculate comprehensive portfolio metrics
realPortfolioSchema.methods.calculateComprehensiveMetrics = function() {
  const totalCurrentValue = this.holdings.reduce((total, holding) => {
    return total + holding.currentValue;
  }, 0);
  
  const totalUnrealizedPnL = this.holdings.reduce((total, holding) => {
    return total + holding.unrealizedPnL;
  }, 0);
  
  const totalDayPnL = this.holdings.reduce((total, holding) => {
    return total + holding.dayPnL;
  }, 0);
  
  const totalPortfolioValue = this.accountBalance + totalCurrentValue;
  const totalPnL = totalUnrealizedPnL + this.totalRealizedPnL;
  const totalPnLPercent = this.totalInvested > 0 ? (totalPnL / this.totalInvested) * 100 : 0;
  const dayPnLPercent = totalPortfolioValue > 0 ? (totalDayPnL / (totalPortfolioValue - totalDayPnL)) * 100 : 0;
  
  // Update performance
  this.performance.totalPortfolioValue = totalPortfolioValue;
  this.performance.totalUnrealizedPnL = totalUnrealizedPnL;
  this.performance.totalUnrealizedPnLPercent = this.totalInvested > 0 ? (totalUnrealizedPnL / this.totalInvested) * 100 : 0;
  this.performance.dayPnL = totalDayPnL;
  this.performance.dayPnLPercent = dayPnLPercent;
  
  return {
    accountBalance: this.accountBalance,
    investedValue: totalCurrentValue,
    totalPortfolioValue,
    totalInvested: this.totalInvested,
    totalRealizedPnL: this.totalRealizedPnL,
    totalUnrealizedPnL,
    totalPnL,
    totalPnLPercent,
    dayPnL: totalDayPnL,
    dayPnLPercent,
    holdings: this.holdings,
    recentTrades: this.tradingHistory.slice(-10)
  };
};

// Update all holdings with current market prices
realPortfolioSchema.methods.updateAllHoldingsWithMarketData = function(marketData) {
  this.holdings.forEach(holding => {
    const stockData = marketData[holding.symbol];
    if (stockData) {
      this.updateHoldingPrice(holding.symbol, stockData.price, stockData.previousClose);
    }
  });
  
  this.calculateComprehensiveMetrics();
};

module.exports = mongoose.model('RealPortfolio', realPortfolioSchema);
