const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
  
  // Order Identification
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  clientOrderId: String,
  brokerOrderId: String,
  exchangeOrderId: String,
  
  // Stock Information
  symbol: {
    type: String,
    required: true,
    uppercase: true
  },
  companyName: {
    type: String,
    required: true
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
  
  // Order Type and Direction
  orderType: {
    type: String,
    enum: ['MARKET', 'LIMIT', 'SL', 'SL-M', 'AMO'],
    required: true
  },
  transactionType: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true
  },
  
  // Quantity and Price
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  pendingQuantity: {
    type: Number,
    required: true
  },
  executedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  cancelledQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  
  price: {
    type: Number,
    required: function() {
      return ['LIMIT', 'SL'].includes(this.orderType);
    },
    min: 0
  },
  triggerPrice: {
    type: Number,
    required: function() {
      return ['SL', 'SL-M'].includes(this.orderType);
    },
    min: 0
  },
  averageExecutionPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Order Configuration
  product: {
    type: String,
    enum: ['CNC', 'MIS', 'NRML'],
    default: 'CNC'
  },
  validity: {
    type: String,
    enum: ['DAY', 'IOC', 'GTD', 'GTC'],
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
    min: 0,
    max: function() {
      return this.quantity;
    }
  },
  
  // Order Status
  status: {
    type: String,
    enum: [
      'PENDING',
      'OPEN',
      'PARTIAL',
      'COMPLETE',
      'CANCELLED',
      'REJECTED',
      'EXPIRED',
      'TRIGGER_PENDING'
    ],
    default: 'PENDING'
  },
  statusMessage: String,
  rejectionReason: String,
  
  // Execution Details
  executions: [{
    executionId: String,
    quantity: Number,
    price: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Financial Information
  orderValue: {
    type: Number,
    required: true
  },
  executedValue: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  orderPlacedTime: {
    type: Date,
    default: Date.now
  },
  lastModifiedTime: {
    type: Date,
    default: Date.now
  },
  executionTime: Date,
  cancellationTime: Date,
  
  // Additional Information
  source: {
    type: String,
    enum: ['WEB', 'MOBILE', 'API', 'TERMINAL'],
    default: 'WEB'
  },
  isAfterMarketOrder: {
    type: Boolean,
    default: false
  },
  tags: [String],
  notes: String,
  
  // Risk Management
  marginRequired: {
    type: Number,
    default: 0
  },
  marginBlocked: {
    type: Number,
    default: 0
  },
  
  // Parent Order (for bracket/cover orders)
  parentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  childOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  orderStrategy: {
    type: String,
    enum: ['SINGLE', 'BRACKET', 'COVER', 'OCO'],
    default: 'SINGLE'
  }
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ userId: 1, orderPlacedTime: -1 });
orderSchema.index({ orderId: 1 }, { unique: true });
orderSchema.index({ symbol: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderPlacedTime: -1 });
orderSchema.index({ exchange: 1, symbol: 1 });

// Virtual fields
orderSchema.virtual('isCompleted').get(function() {
  return this.status === 'COMPLETE';
});

orderSchema.virtual('isPending').get(function() {
  return ['PENDING', 'OPEN', 'PARTIAL', 'TRIGGER_PENDING'].includes(this.status);
});

orderSchema.virtual('isCancelled').get(function() {
  return this.status === 'CANCELLED';
});

orderSchema.virtual('isRejected').get(function() {
  return this.status === 'REJECTED';
});

orderSchema.virtual('executionPercentage').get(function() {
  if (this.quantity === 0) return 0;
  return (this.executedQuantity / this.quantity) * 100;
});

orderSchema.virtual('remainingQuantity').get(function() {
  return this.quantity - this.executedQuantity - this.cancelledQuantity;
});

// Pre-save middleware
orderSchema.pre('save', function(next) {
  // Update last modified time
  this.lastModifiedTime = new Date();
  
  // Calculate pending quantity
  this.pendingQuantity = this.quantity - this.executedQuantity - this.cancelledQuantity;
  
  // Update status based on execution
  if (this.executedQuantity === 0 && this.cancelledQuantity === 0) {
    if (this.status === 'PENDING') {
      // Keep as pending until broker confirmation
    }
  } else if (this.executedQuantity === this.quantity) {
    this.status = 'COMPLETE';
    if (!this.executionTime) {
      this.executionTime = new Date();
    }
  } else if (this.executedQuantity > 0 && this.executedQuantity < this.quantity) {
    this.status = 'PARTIAL';
  } else if (this.cancelledQuantity === this.quantity) {
    this.status = 'CANCELLED';
    if (!this.cancellationTime) {
      this.cancellationTime = new Date();
    }
  }
  
  // Calculate executed value
  this.executedValue = this.averageExecutionPrice * this.executedQuantity;
  
  next();
});

// Instance methods
orderSchema.methods.addExecution = function(executionData) {
  const { quantity, price, executionId } = executionData;
  
  // Add execution record
  this.executions.push({
    executionId: executionId || `EXE_${Date.now()}`,
    quantity,
    price,
    timestamp: new Date()
  });
  
  // Update executed quantity and average price
  const newExecutedQuantity = this.executedQuantity + quantity;
  const totalValue = (this.averageExecutionPrice * this.executedQuantity) + (price * quantity);
  
  this.averageExecutionPrice = totalValue / newExecutedQuantity;
  this.executedQuantity = newExecutedQuantity;
  
  return this.save();
};

orderSchema.methods.cancelOrder = function(reason) {
  if (this.isPending) {
    this.status = 'CANCELLED';
    this.rejectionReason = reason;
    this.cancellationTime = new Date();
    this.cancelledQuantity = this.pendingQuantity;
    
    return this.save();
  }
  
  throw new Error('Order cannot be cancelled');
};

orderSchema.methods.rejectOrder = function(reason) {
  this.status = 'REJECTED';
  this.rejectionReason = reason;
  this.statusMessage = reason;
  
  return this.save();
};

orderSchema.methods.modifyOrder = function(modifications) {
  if (!this.isPending) {
    throw new Error('Order cannot be modified');
  }
  
  const allowedModifications = ['quantity', 'price', 'triggerPrice', 'validity', 'validityDate'];
  
  Object.keys(modifications).forEach(key => {
    if (allowedModifications.includes(key)) {
      this[key] = modifications[key];
    }
  });
  
  // Recalculate order value if quantity or price changed
  if (modifications.quantity || modifications.price) {
    this.orderValue = (modifications.quantity || this.quantity) * 
                     (modifications.price || this.price || 0);
  }
  
  return this.save();
};

orderSchema.methods.canCancel = function() {
  return this.isPending && !this.isAfterMarketOrder;
};

orderSchema.methods.canModify = function() {
  return this.isPending && this.status !== 'TRIGGER_PENDING';
};

// Static methods
orderSchema.statics.findByUserId = function(userId, options = {}) {
  const query = this.find({ userId });
  
  if (options.symbol) {
    query.where('symbol').equals(options.symbol);
  }
  
  if (options.status) {
    if (Array.isArray(options.status)) {
      query.where('status').in(options.status);
    } else {
      query.where('status').equals(options.status);
    }
  }
  
  if (options.transactionType) {
    query.where('transactionType').equals(options.transactionType);
  }
  
  if (options.startDate && options.endDate) {
    query.where('orderPlacedTime').gte(options.startDate).lte(options.endDate);
  }
  
  return query.sort({ orderPlacedTime: -1 }).limit(options.limit || 100);
};

orderSchema.statics.findByOrderId = function(orderId) {
  return this.findOne({ orderId });
};

orderSchema.statics.generateOrderId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ORD${timestamp}${random}`.toUpperCase();
};

orderSchema.statics.getActiveOrders = function(userId) {
  return this.find({
    userId,
    status: { $in: ['PENDING', 'OPEN', 'PARTIAL', 'TRIGGER_PENDING'] }
  }).sort({ orderPlacedTime: -1 });
};

orderSchema.statics.getOrderHistory = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    userId,
    orderPlacedTime: { $gte: startDate }
  }).sort({ orderPlacedTime: -1 });
};

orderSchema.statics.getOrdersBySymbol = function(userId, symbol) {
  return this.find({ userId, symbol }).sort({ orderPlacedTime: -1 });
};

module.exports = mongoose.model('Order', orderSchema);
