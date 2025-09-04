const mongoose = require('mongoose');

const marketDataSchema = new mongoose.Schema({
  // Stock Identification
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    index: true
  },
  companyName: {
    type: String,
    required: true
  },
  isin: String,
  exchange: {
    type: String,
    enum: ['NSE', 'BSE'],
    default: 'NSE'
  },
  segment: {
    type: String,
    enum: ['EQ', 'FUT', 'OPT', 'CURRENCY', 'COMMODITY'],
    default: 'EQ'
  },
  
  // Current Market Data
  currentPrice: {
    type: Number,
    required: true,
    min: 0
  },
  previousClose: {
    type: Number,
    required: true,
    min: 0
  },
  openPrice: {
    type: Number,
    required: true,
    min: 0
  },
  dayHigh: {
    type: Number,
    required: true,
    min: 0
  },
  dayLow: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Change Information
  change: {
    value: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    }
  },
  
  // Volume Data
  volume: {
    type: Number,
    default: 0,
    min: 0
  },
  averageVolume: {
    type: Number,
    default: 0,
    min: 0
  },
  valueTraded: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Market Depth
  bid: {
    price: {
      type: Number,
      min: 0
    },
    quantity: {
      type: Number,
      min: 0
    }
  },
  ask: {
    price: {
      type: Number,
      min: 0
    },
    quantity: {
      type: Number,
      min: 0
    }
  },
  marketDepth: {
    buy: [{
      price: Number,
      quantity: Number,
      orders: Number
    }],
    sell: [{
      price: Number,
      quantity: Number,
      orders: Number
    }]
  },
  
  // 52-week Data
  week52High: {
    type: Number,
    min: 0
  },
  week52Low: {
    type: Number,
    min: 0
  },
  
  // Technical Indicators
  technicalIndicators: {
    sma20: Number,
    sma50: Number,
    sma200: Number,
    ema12: Number,
    ema26: Number,
    rsi: Number,
    macd: {
      macd: Number,
      signal: Number,
      histogram: Number
    },
    bollingerBands: {
      upper: Number,
      middle: Number,
      lower: Number
    }
  },
  
  // Company Information
  sector: String,
  industry: String,
  marketCap: {
    type: Number,
    min: 0
  },
  faceValue: {
    type: Number,
    min: 0
  },
  bookValue: {
    type: Number,
    min: 0
  },
  
  // Financial Ratios
  fundamentals: {
    pe: Number,
    pb: Number,
    eps: Number,
    dividend: Number,
    dividendYield: Number,
    roe: Number,
    roa: Number,
    debtToEquity: Number,
    currentRatio: Number,
    quickRatio: Number
  },
  
  // Trading Information
  lotSize: {
    type: Number,
    default: 1
  },
  tickSize: {
    type: Number,
    default: 0.05
  },
  upperCircuitLimit: Number,
  lowerCircuitLimit: Number,
  
  // Options Chain (for equity with options)
  optionsData: {
    hasOptions: {
      type: Boolean,
      default: false
    },
    nearestExpiry: Date,
    optionChain: [{
      strike: Number,
      expiry: Date,
      call: {
        ltp: Number,
        volume: Number,
        oi: Number,
        change: Number
      },
      put: {
        ltp: Number,
        volume: Number,
        oi: Number,
        change: Number
      }
    }]
  },
  
  // Data Quality and Timing
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  dataSource: {
    type: String,
    enum: ['UPSTOX', 'MANUAL', 'CALCULATED'],
    default: 'UPSTOX'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Historical Data Points (for quick access)
  priceHistory: [{
    date: Date,
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
marketDataSchema.index({ symbol: 1, exchange: 1 }, { unique: true });
marketDataSchema.index({ sector: 1 });
marketDataSchema.index({ marketCap: -1 });
marketDataSchema.index({ lastUpdated: -1 });
marketDataSchema.index({ 'change.percentage': -1 });
marketDataSchema.index({ volume: -1 });

// Virtual fields
marketDataSchema.virtual('isGainer').get(function() {
  return this.change.value > 0;
});

marketDataSchema.virtual('isLoser').get(function() {
  return this.change.value < 0;
});

marketDataSchema.virtual('isFlat').get(function() {
  return this.change.value === 0;
});

marketDataSchema.virtual('spreadPercentage').get(function() {
  if (this.bid.price && this.ask.price) {
    return ((this.ask.price - this.bid.price) / this.ask.price) * 100;
  }
  return 0;
});

marketDataSchema.virtual('volumeRatio').get(function() {
  if (this.averageVolume && this.averageVolume > 0) {
    return this.volume / this.averageVolume;
  }
  return 0;
});

marketDataSchema.virtual('priceToHigh52').get(function() {
  if (this.week52High) {
    return (this.currentPrice / this.week52High) * 100;
  }
  return 0;
});

marketDataSchema.virtual('priceToLow52').get(function() {
  if (this.week52Low) {
    return (this.currentPrice / this.week52Low) * 100;
  }
  return 0;
});

// Instance methods
marketDataSchema.methods.updatePrice = function(newPrice, volume = 0) {
  const previousPrice = this.currentPrice;
  this.currentPrice = newPrice;
  
  // Update day high/low
  if (newPrice > this.dayHigh) {
    this.dayHigh = newPrice;
  }
  if (newPrice < this.dayLow) {
    this.dayLow = newPrice;
  }
  
  // Calculate change
  this.change.value = newPrice - this.previousClose;
  this.change.percentage = ((newPrice - this.previousClose) / this.previousClose) * 100;
  
  // Update volume
  if (volume > 0) {
    this.volume += volume;
  }
  
  this.lastUpdated = new Date();
  
  return this.save();
};

marketDataSchema.methods.addToHistory = function(ohlcData) {
  this.priceHistory.push({
    date: ohlcData.date || new Date(),
    open: ohlcData.open,
    high: ohlcData.high,
    low: ohlcData.low,
    close: ohlcData.close,
    volume: ohlcData.volume || 0
  });
  
  // Keep only last 100 records for performance
  if (this.priceHistory.length > 100) {
    this.priceHistory = this.priceHistory.slice(-100);
  }
  
  return this.save();
};

marketDataSchema.methods.updateMarketDepth = function(depthData) {
  this.marketDepth = depthData;
  this.lastUpdated = new Date();
  
  // Update bid/ask from market depth
  if (depthData.buy && depthData.buy.length > 0) {
    this.bid = {
      price: depthData.buy[0].price,
      quantity: depthData.buy[0].quantity
    };
  }
  
  if (depthData.sell && depthData.sell.length > 0) {
    this.ask = {
      price: depthData.sell[0].price,
      quantity: depthData.sell[0].quantity
    };
  }
  
  return this.save();
};

marketDataSchema.methods.isStale = function(minutes = 5) {
  const now = new Date();
  const diffInMinutes = (now - this.lastUpdated) / (1000 * 60);
  return diffInMinutes > minutes;
};

marketDataSchema.methods.calculateTechnicalIndicators = function() {
  const prices = this.priceHistory.map(p => p.close).slice(-50);
  
  if (prices.length >= 20) {
    // Simple Moving Averages
    this.technicalIndicators.sma20 = this.calculateSMA(prices, 20);
    
    if (prices.length >= 50) {
      this.technicalIndicators.sma50 = this.calculateSMA(prices, 50);
    }
    
    // RSI
    this.technicalIndicators.rsi = this.calculateRSI(prices, 14);
  }
  
  return this.save();
};

marketDataSchema.methods.calculateSMA = function(prices, period) {
  if (prices.length < period) return null;
  
  const recentPrices = prices.slice(-period);
  const sum = recentPrices.reduce((acc, price) => acc + price, 0);
  return sum / period;
};

marketDataSchema.methods.calculateRSI = function(prices, period = 14) {
  if (prices.length < period + 1) return null;
  
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);
  
  const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
  const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// Static methods
marketDataSchema.statics.findBySymbol = function(symbol, exchange = 'NSE') {
  return this.findOne({ symbol: symbol.toUpperCase(), exchange });
};

marketDataSchema.statics.getTopGainers = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'change.percentage': -1 })
    .limit(limit);
};

marketDataSchema.statics.getTopLosers = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'change.percentage': 1 })
    .limit(limit);
};

marketDataSchema.statics.getMostActive = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ volume: -1 })
    .limit(limit);
};

marketDataSchema.statics.searchStocks = function(query) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    isActive: true,
    $or: [
      { symbol: searchRegex },
      { companyName: searchRegex }
    ]
  }).limit(20);
};

marketDataSchema.statics.getBySector = function(sector) {
  return this.find({ sector, isActive: true })
    .sort({ marketCap: -1 });
};

marketDataSchema.statics.getMarketOverview = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalStocks: { $sum: 1 },
        gainers: {
          $sum: {
            $cond: [{ $gt: ['$change.value', 0] }, 1, 0]
          }
        },
        losers: {
          $sum: {
            $cond: [{ $lt: ['$change.value', 0] }, 1, 0]
          }
        },
        unchanged: {
          $sum: {
            $cond: [{ $eq: ['$change.value', 0] }, 1, 0]
          }
        },
        avgChange: { $avg: '$change.percentage' }
      }
    }
  ]);
};

module.exports = mongoose.model('MarketData', marketDataSchema);
