const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Portfolio Overview
  totalValue: {
    type: Number,
    default: 0
  },
  investedAmount: {
    type: Number,
    default: 0
  },
  availableBalance: {
    type: Number,
    default: 0
  },
  dayChange: {
    value: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  totalReturns: {
    value: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  
  // Holdings
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
    marketValue: {
      type: Number,
      default: 0
    },
    investedValue: {
      type: Number,
      default: 0
    },
    dayChange: {
      value: {
        type: Number,
        default: 0
      },
      percentage: {
        type: Number,
        default: 0
      }
    },
    totalReturns: {
      value: {
        type: Number,
        default: 0
      },
      percentage: {
        type: Number,
        default: 0
      }
    },
    sector: String,
    exchange: {
      type: String,
      enum: ['NSE', 'BSE'],
      default: 'NSE'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Watchlist
  watchlist: [{
    symbol: {
      type: String,
      required: true
    },
    companyName: {
      type: String,
      required: true
    },
    currentPrice: {
      type: Number,
      default: 0
    },
    dayChange: {
      value: {
        type: Number,
        default: 0
      },
      percentage: {
        type: Number,
        default: 0
      }
    },
    sector: String,
    exchange: {
      type: String,
      enum: ['NSE', 'BSE'],
      default: 'NSE'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    alerts: [{
      type: {
        type: String,
        enum: ['price_above', 'price_below', 'volume_spike', 'percentage_change'],
        required: true
      },
      value: {
        type: Number,
        required: true
      },
      isActive: {
        type: Boolean,
        default: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  
  // Performance Metrics
  performance: {
    xirr: {
      type: Number,
      default: 0
    },
    cagr: {
      type: Number,
      default: 0
    },
    sharpeRatio: {
      type: Number,
      default: 0
    },
    maxDrawdown: {
      type: Number,
      default: 0
    },
    volatility: {
      type: Number,
      default: 0
    }
  },
  
  // Sector-wise Distribution
  sectorDistribution: [{
    sector: String,
    allocation: Number, // percentage
    value: Number
  }],
  
  // Asset Allocation
  assetAllocation: {
    equity: {
      percentage: {
        type: Number,
        default: 0
      },
      value: {
        type: Number,
        default: 0
      }
    },
    debt: {
      percentage: {
        type: Number,
        default: 0
      },
      value: {
        type: Number,
        default: 0
      }
    },
    commodity: {
      percentage: {
        type: Number,
        default: 0
      },
      value: {
        type: Number,
        default: 0
      }
    },
    cash: {
      percentage: {
        type: Number,
        default: 0
      },
      value: {
        type: Number,
        default: 0
      }
    }
  }
}, {
  timestamps: true
});

// Indexes
portfolioSchema.index({ 'holdings.symbol': 1 });
portfolioSchema.index({ 'watchlist.symbol': 1 });
portfolioSchema.index({ createdAt: -1 });

// Virtual fields
portfolioSchema.virtual('totalHoldings').get(function() {
  return this.holdings.length;
});

portfolioSchema.virtual('totalWatchlistItems').get(function() {
  return this.watchlist.length;
});

portfolioSchema.virtual('profitLoss').get(function() {
  return this.totalValue - this.investedAmount;
});

portfolioSchema.virtual('profitLossPercentage').get(function() {
  if (this.investedAmount === 0) return 0;
  return ((this.totalValue - this.investedAmount) / this.investedAmount) * 100;
});

// Instance methods
portfolioSchema.methods.addToWatchlist = function(stockData) {
  const existingIndex = this.watchlist.findIndex(item => item.symbol === stockData.symbol);
  
  if (existingIndex === -1) {
    this.watchlist.push({
      symbol: stockData.symbol,
      companyName: stockData.companyName,
      currentPrice: stockData.currentPrice || 0,
      sector: stockData.sector,
      exchange: stockData.exchange || 'NSE'
    });
  }
  
  return this.save();
};

portfolioSchema.methods.removeFromWatchlist = function(symbol) {
  this.watchlist = this.watchlist.filter(item => item.symbol !== symbol);
  return this.save();
};

portfolioSchema.methods.updateHolding = function(symbol, updateData) {
  const holdingIndex = this.holdings.findIndex(holding => holding.symbol === symbol);
  
  if (holdingIndex !== -1) {
    Object.assign(this.holdings[holdingIndex], updateData);
    return this.save();
  }
  
  throw new Error('Holding not found');
};

portfolioSchema.methods.addHolding = function(holdingData) {
  const existingIndex = this.holdings.findIndex(holding => holding.symbol === holdingData.symbol);
  
  if (existingIndex !== -1) {
    // Update existing holding
    const existing = this.holdings[existingIndex];
    const totalQuantity = existing.quantity + holdingData.quantity;
    const totalValue = (existing.quantity * existing.averagePrice) + (holdingData.quantity * holdingData.averagePrice);
    
    existing.quantity = totalQuantity;
    existing.averagePrice = totalValue / totalQuantity;
    existing.investedValue = totalQuantity * existing.averagePrice;
  } else {
    // Add new holding
    this.holdings.push({
      ...holdingData,
      investedValue: holdingData.quantity * holdingData.averagePrice
    });
  }
  
  return this.save();
};

portfolioSchema.methods.removeHolding = function(symbol, quantity) {
  const holdingIndex = this.holdings.findIndex(holding => holding.symbol === symbol);
  
  if (holdingIndex !== -1) {
    const holding = this.holdings[holdingIndex];
    
    if (quantity >= holding.quantity) {
      // Remove entire holding
      this.holdings.splice(holdingIndex, 1);
    } else {
      // Reduce quantity
      holding.quantity -= quantity;
      holding.investedValue = holding.quantity * holding.averagePrice;
    }
    
    return this.save();
  }
  
  throw new Error('Holding not found');
};

portfolioSchema.methods.calculateTotalValue = function() {
  this.totalValue = this.holdings.reduce((total, holding) => {
    return total + (holding.currentPrice * holding.quantity);
  }, 0) + this.availableBalance;
  
  return this.totalValue;
};

portfolioSchema.methods.calculateInvestedAmount = function() {
  this.investedAmount = this.holdings.reduce((total, holding) => {
    return total + holding.investedValue;
  }, 0);
  
  return this.investedAmount;
};

portfolioSchema.methods.updateSectorDistribution = function() {
  const sectorMap = new Map();
  
  this.holdings.forEach(holding => {
    if (holding.sector) {
      const currentValue = sectorMap.get(holding.sector) || 0;
      sectorMap.set(holding.sector, currentValue + holding.marketValue);
    }
  });
  
  this.sectorDistribution = Array.from(sectorMap.entries()).map(([sector, value]) => ({
    sector,
    value,
    allocation: this.totalValue > 0 ? (value / this.totalValue) * 100 : 0
  }));
};

// Static methods
portfolioSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

portfolioSchema.statics.createDefaultPortfolio = function(userId) {
  return this.create({
    userId,
    totalValue: 0,
    investedAmount: 0,
    availableBalance: 10000, // Default demo balance
    holdings: [],
    watchlist: []
  });
};

module.exports = mongoose.model('Portfolio', portfolioSchema);
