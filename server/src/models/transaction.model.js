const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true
  },
  
  // Transaction Details
  type: {
    type: String,
    enum: ['BUY', 'SELL', 'DIVIDEND', 'BONUS', 'SPLIT', 'RIGHTS', 'DEPOSIT', 'WITHDRAWAL'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'EXECUTED', 'CANCELLED', 'REJECTED', 'PARTIAL'],
    default: 'PENDING'
  },
  
  // Stock Information
  symbol: {
    type: String,
    required: function() {
      return ['BUY', 'SELL', 'DIVIDEND', 'BONUS', 'SPLIT', 'RIGHTS'].includes(this.type);
    }
  },
  companyName: {
    type: String,
    required: function() {
      return ['BUY', 'SELL', 'DIVIDEND', 'BONUS', 'SPLIT', 'RIGHTS'].includes(this.type);
    }
  },
  exchange: {
    type: String,
    enum: ['NSE', 'BSE'],
    default: 'NSE'
  },
  segment: {
    type: String,
    enum: ['CASH', 'F&O', 'CURRENCY', 'COMMODITY'],
    default: 'CASH'
  },
  
  // Order Details
  orderType: {
    type: String,
    enum: ['MARKET', 'LIMIT', 'SL', 'SL-M'],
    default: 'MARKET'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  executedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  price: {
    type: Number,
    required: function() {
      return this.orderType === 'LIMIT';
    },
    min: 0
  },
  executedPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  triggerPrice: {
    type: Number,
    required: function() {
      return ['SL', 'SL-M'].includes(this.orderType);
    }
  },
  
  // Financial Details
  amount: {
    type: Number,
    required: true
  },
  executedAmount: {
    type: Number,
    default: 0
  },
  charges: {
    brokerage: {
      type: Number,
      default: 0
    },
    stt: {
      type: Number,
      default: 0
    },
    exchangeCharges: {
      type: Number,
      default: 0
    },
    gst: {
      type: Number,
      default: 0
    },
    stampDuty: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  netAmount: {
    type: Number,
    default: 0
  },
  
  // Trading Details
  validity: {
    type: String,
    enum: ['DAY', 'IOC', 'GTD'],
    default: 'DAY'
  },
  validityDate: {
    type: Date,
    required: function() {
      return this.validity === 'GTD';
    }
  },
  disclosed: {
    type: Number,
    min: 0
  },
  
  // System Fields
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  brokerOrderId: String,
  exchangeOrderId: String,
  
  // Timestamps
  orderTime: {
    type: Date,
    default: Date.now
  },
  executionTime: {
    type: Date
  },
  updateTime: {
    type: Date
  },
  
  // Additional Information
  remarks: String,
  rejectionReason: String,
  tags: [String],
  
  // P&L Information (for SELL transactions)
  buyPrice: {
    type: Number
  },
  profitLoss: {
    type: Number
  },
  profitLossPercentage: {
    type: Number
  },
  
  // Corporate Actions
  corporateAction: {
    type: {
      type: String,
      enum: ['DIVIDEND', 'BONUS', 'SPLIT', 'RIGHTS', 'MERGER']
    },
    ratio: String,
    recordDate: Date,
    paymentDate: Date
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ portfolioId: 1 });
transactionSchema.index({ symbol: 1 });
transactionSchema.index({ orderId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ orderTime: -1 });

// Virtual fields
transactionSchema.virtual('isCompleted').get(function() {
  return this.status === 'EXECUTED';
});

transactionSchema.virtual('isPending').get(function() {
  return this.status === 'PENDING';
});

transactionSchema.virtual('totalCharges').get(function() {
  return this.charges.total;
});

transactionSchema.virtual('executionRate').get(function() {
  if (this.quantity === 0) return 0;
  return (this.executedQuantity / this.quantity) * 100;
});

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  // Calculate total charges
  if (this.charges) {
    this.charges.total = (this.charges.brokerage || 0) +
                        (this.charges.stt || 0) +
                        (this.charges.exchangeCharges || 0) +
                        (this.charges.gst || 0) +
                        (this.charges.stampDuty || 0);
  }
  
  // Calculate net amount
  if (this.type === 'BUY') {
    this.netAmount = this.executedAmount + this.charges.total;
  } else if (this.type === 'SELL') {
    this.netAmount = this.executedAmount - this.charges.total;
  }
  
  // Update execution time when status changes to EXECUTED
  if (this.isModified('status') && this.status === 'EXECUTED' && !this.executionTime) {
    this.executionTime = new Date();
  }
  
  // Update update time
  if (this.isModified() && !this.isNew) {
    this.updateTime = new Date();
  }
  
  next();
});

// Instance methods
transactionSchema.methods.calculateCharges = function(brokerageRate = 0.03) {
  const amount = this.executedAmount || this.amount;
  
  // Brokerage calculation
  if (this.type === 'BUY') {
    this.charges.brokerage = Math.min(amount * (brokerageRate / 100), 20);
  } else if (this.type === 'SELL') {
    this.charges.brokerage = Math.min(amount * (brokerageRate / 100), 20);
  }
  
  // STT calculation
  if (this.type === 'SELL') {
    this.charges.stt = amount * 0.001; // 0.1%
  } else if (this.type === 'BUY') {
    this.charges.stt = amount * 0.0001; // 0.01%
  }
  
  // Exchange charges (approximation)
  this.charges.exchangeCharges = amount * 0.0000345;
  
  // GST on brokerage and exchange charges
  this.charges.gst = (this.charges.brokerage + this.charges.exchangeCharges) * 0.18;
  
  // Stamp duty
  if (this.type === 'BUY') {
    this.charges.stampDuty = amount * 0.00015; // 0.015%
  }
  
  // Calculate total
  this.charges.total = this.charges.brokerage +
                      this.charges.stt +
                      this.charges.exchangeCharges +
                      this.charges.gst +
                      this.charges.stampDuty;
  
  return this.charges;
};

transactionSchema.methods.markExecuted = function(executedPrice, executedQuantity) {
  this.status = 'EXECUTED';
  this.executedPrice = executedPrice;
  this.executedQuantity = executedQuantity || this.quantity;
  this.executedAmount = this.executedPrice * this.executedQuantity;
  this.executionTime = new Date();
  
  // Calculate charges
  this.calculateCharges();
  
  return this.save();
};

transactionSchema.methods.markCancelled = function(reason) {
  this.status = 'CANCELLED';
  this.rejectionReason = reason;
  this.updateTime = new Date();
  
  return this.save();
};

transactionSchema.methods.markRejected = function(reason) {
  this.status = 'REJECTED';
  this.rejectionReason = reason;
  this.updateTime = new Date();
  
  return this.save();
};

transactionSchema.methods.calculateProfitLoss = function(buyPrice) {
  if (this.type === 'SELL' && buyPrice) {
    this.buyPrice = buyPrice;
    this.profitLoss = (this.executedPrice - buyPrice) * this.executedQuantity;
    this.profitLossPercentage = ((this.executedPrice - buyPrice) / buyPrice) * 100;
  }
  
  return this.save();
};

// Static methods
transactionSchema.statics.findByUserId = function(userId, options = {}) {
  const query = this.find({ userId });
  
  if (options.symbol) {
    query.where('symbol').equals(options.symbol);
  }
  
  if (options.type) {
    query.where('type').equals(options.type);
  }
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  if (options.startDate && options.endDate) {
    query.where('orderTime').gte(options.startDate).lte(options.endDate);
  }
  
  return query.sort({ orderTime: -1 }).limit(options.limit || 100);
};

transactionSchema.statics.findByOrderId = function(orderId) {
  return this.findOne({ orderId });
};

transactionSchema.statics.generateOrderId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ORD${timestamp}${random}`.toUpperCase();
};

transactionSchema.statics.getTransactionSummary = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        status: 'EXECUTED',
        orderTime: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$executedAmount' },
        totalCharges: { $sum: '$charges.total' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$executedAmount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema);
