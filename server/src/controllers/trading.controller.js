const Order = require('../models/order.model');
const Transaction = require('../models/transaction.model');
const Portfolio = require('../models/portfolio.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// Place a new order
const placeOrder = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', errors.array());
  }

  const {
    symbol,
    quantity,
    orderType,
    transactionType,
    price,
    triggerPrice,
    product = 'CNC',
    validity = 'DAY',
    validityDate,
    disclosed
  } = req.body;

  const userId = req.user.id;

  // Get user's portfolio
  const portfolio = await Portfolio.findByUserId(userId);
  if (!portfolio) {
    throw new ApiError(404, 'Portfolio not found');
  }

  // Get market data for the symbol
  const marketData = await MarketData.findBySymbol(symbol);
  if (!marketData) {
    throw new ApiError(404, 'Stock not found');
  }

  // Calculate order value
  let orderValue;
  if (orderType === 'MARKET') {
    orderValue = quantity * marketData.currentPrice;
  } else {
    orderValue = quantity * price;
  }

  // Validate sufficient balance for BUY orders
  if (transactionType === 'BUY') {
    if (portfolio.availableBalance < orderValue) {
      throw new ApiError(400, 'Insufficient balance');
    }
  }

  // Validate sufficient holdings for SELL orders
  if (transactionType === 'SELL') {
    const holding = portfolio.holdings.find(h => h.symbol === symbol);
    if (!holding || holding.quantity < quantity) {
      throw new ApiError(400, 'Insufficient holdings');
    }
  }

  // Generate order ID
  const orderId = Order.generateOrderId();

  // Create order
  const order = await Order.create({
    userId,
    portfolioId: portfolio._id,
    orderId,
    symbol: symbol.toUpperCase(),
    companyName: marketData.companyName,
    exchange: marketData.exchange,
    orderType,
    transactionType,
    quantity,
    pendingQuantity: quantity,
    price: orderType === 'MARKET' ? undefined : price,
    triggerPrice,
    product,
    validity,
    validityDate,
    disclosed,
    orderValue,
    status: 'PENDING'
  });

  // For MARKET orders, execute immediately (simulation)
  if (orderType === 'MARKET') {
    await executeOrder(order._id, marketData.currentPrice, quantity);
  }

  // Block balance/holdings
  if (transactionType === 'BUY') {
    portfolio.availableBalance -= orderValue;
    await portfolio.save();
  }

  res.status(201).json(
    new ApiResponse(201, {
      order,
      message: `${transactionType} order placed successfully`
    }, 'Order placed successfully')
  );
});

// Execute an order (internal function)
const executeOrder = async (orderId, executionPrice, executionQuantity) => {
  const order = await Order.findById(orderId).populate('portfolioId');
  if (!order) {
    throw new Error('Order not found');
  }

  // Add execution record
  await order.addExecution({
    quantity: executionQuantity,
    price: executionPrice,
    executionId: `EXE_${Date.now()}`
  });

  // Create transaction record
  const transaction = await Transaction.create({
    userId: order.userId,
    portfolioId: order.portfolioId._id,
    type: order.transactionType,
    status: 'EXECUTED',
    symbol: order.symbol,
    companyName: order.companyName,
    exchange: order.exchange,
    orderType: order.orderType,
    quantity: executionQuantity,
    executedQuantity: executionQuantity,
    executedPrice: executionPrice,
    amount: executionPrice * executionQuantity,
    executedAmount: executionPrice * executionQuantity,
    orderId: order.orderId,
    orderTime: order.orderPlacedTime,
    executionTime: new Date()
  });

  // Calculate charges
  transaction.calculateCharges();
  await transaction.save();

  // Update portfolio
  const portfolio = order.portfolioId;
  
  if (order.transactionType === 'BUY') {
    // Add to holdings
    await portfolio.addHolding({
      symbol: order.symbol,
      companyName: order.companyName,
      quantity: executionQuantity,
      averagePrice: executionPrice,
      currentPrice: executionPrice,
      sector: 'Technology', // You would get this from market data
      exchange: order.exchange
    });

    // Adjust balance (return unused amount and deduct actual cost + charges)
    const actualCost = transaction.netAmount;
    const blockedAmount = order.orderValue;
    portfolio.availableBalance += blockedAmount - actualCost;
  } else {
    // Remove from holdings
    await portfolio.removeHolding(order.symbol, executionQuantity);
    
    // Add to balance
    portfolio.availableBalance += transaction.netAmount;
  }

  // Update portfolio totals
  portfolio.calculateTotalValue();
  portfolio.calculateInvestedAmount();
  await portfolio.save();

  return transaction;
};

// Cancel an order
const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const order = await Order.findOne({ orderId, userId });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (!order.canCancel()) {
    throw new ApiError(400, 'Order cannot be cancelled');
  }

  await order.cancelOrder('Cancelled by user');

  // Release blocked balance/holdings
  if (order.transactionType === 'BUY') {
    const portfolio = await Portfolio.findByUserId(userId);
    portfolio.availableBalance += order.orderValue;
    await portfolio.save();
  }

  res.status(200).json(
    new ApiResponse(200, {
      order,
      message: 'Order cancelled successfully'
    }, 'Order cancelled')
  );
});

// Modify an order
const modifyOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  const modifications = req.body;

  const order = await Order.findOne({ orderId, userId });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (!order.canModify()) {
    throw new ApiError(400, 'Order cannot be modified');
  }

  await order.modifyOrder(modifications);

  res.status(200).json(
    new ApiResponse(200, {
      order,
      message: 'Order modified successfully'
    }, 'Order modified')
  );
});

// Get user's orders
const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    status,
    symbol,
    transactionType,
    startDate,
    endDate,
    limit = 50,
    page = 1
  } = req.query;

  const options = {
    limit: parseInt(limit),
    symbol: symbol?.toUpperCase(),
    status: status?.split(','),
    transactionType,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined
  };

  const orders = await Order.findByUserId(userId, options);
  const totalOrders = await Order.countDocuments({ userId });

  res.status(200).json(
    new ApiResponse(200, {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / parseInt(limit))
      }
    }, 'Orders retrieved successfully')
  );
});

// Get active orders
const getActiveOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const activeOrders = await Order.getActiveOrders(userId);

  res.status(200).json(
    new ApiResponse(200, {
      orders: activeOrders,
      count: activeOrders.length
    }, 'Active orders retrieved successfully')
  );
});

// Get order history
const getOrderHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { days = 30 } = req.query;

  const orderHistory = await Order.getOrderHistory(userId, parseInt(days));

  res.status(200).json(
    new ApiResponse(200, {
      orders: orderHistory,
      count: orderHistory.length,
      period: `${days} days`
    }, 'Order history retrieved successfully')
  );
});

// Get order details
const getOrderDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const order = await Order.findOne({ orderId, userId });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Get related transaction if order is executed
  let transaction = null;
  if (order.status === 'COMPLETE') {
    transaction = await Transaction.findOne({ orderId: order.orderId });
  }

  res.status(200).json(
    new ApiResponse(200, {
      order,
      transaction
    }, 'Order details retrieved successfully')
  );
});

// Get trading statistics
const getTradingStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const [orderStats, transactionSummary] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          userId: require('mongoose').Types.ObjectId(userId),
          orderPlacedTime: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETE'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] }
          },
          totalValue: { $sum: '$executedValue' },
          buyOrders: {
            $sum: { $cond: [{ $eq: ['$transactionType', 'BUY'] }, 1, 0] }
          },
          sellOrders: {
            $sum: { $cond: [{ $eq: ['$transactionType', 'SELL'] }, 1, 0] }
          }
        }
      }
    ]),
    Transaction.getTransactionSummary(userId, start, end)
  ]);

  const stats = orderStats[0] || {
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalValue: 0,
    buyOrders: 0,
    sellOrders: 0
  };

  res.status(200).json(
    new ApiResponse(200, {
      orderStats: stats,
      transactionSummary,
      period: {
        startDate: start,
        endDate: end
      }
    }, 'Trading statistics retrieved successfully')
  );
});

module.exports = {
  placeOrder,
  cancelOrder,
  modifyOrder,
  getUserOrders,
  getActiveOrders,
  getOrderHistory,
  getOrderDetails,
  getTradingStats
};
