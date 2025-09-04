const express = require('express');
const router = express.Router();

// Import controllers
const {
  placeOrder,
  getUserOrders,
  getOrderDetails,
  modifyOrder,
  cancelOrder,
  getActiveOrders,
  getOrderHistory,
  getTradingStats
} = require('../controllers/trading.controller');

// Import middleware
const auth = require('../middlewares/auth');

// All routes require authentication
router.use(auth);

// Order management routes
router.post('/orders/place', placeOrder);
router.get('/orders', getUserOrders);
router.get('/orders/active', getActiveOrders);
router.get('/orders/history', getOrderHistory);
router.get('/orders/:orderId', getOrderDetails);
router.put('/orders/:orderId/modify', modifyOrder);
router.delete('/orders/:orderId/cancel', cancelOrder);

// Transaction routes (using getUserOrders with transaction filter)
router.get('/transactions', getUserOrders);

// Statistics routes
router.get('/stats', getTradingStats);

module.exports = router;
