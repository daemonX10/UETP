const axios = require("axios");
const { Broker } = require("../models/broker.model");
const { Asset } = require("../models/assest.model");
const { decryptData } = require("../utils/encryption");
const getDynamicHeaders = require("../utils/fetchHeader");

const brokerApiConfig = {
  angelOne: {
    baseUrl: 'https://apiconnect.angelbroking.com',
    endpoints: {
      holdings: '/rest/secure/angelbroking/portfolio/v1/holdings',
      order: '/rest/secure/angelbroking/order/v1/placeOrder',
    },
  },
  dhan: {
    baseUrl: 'https://api.dhan.co',
    endpoints: {
      holdings: '/holdings',
      order: '/orders',
    },
  },
  upstox: {
    baseUrl: 'https://api.upstox.com/v2',
    endpoints: {
      holdings: '/portfolio/holdings',
      order: '/order/place',
    },
  },
};

const brokerNames = {
  angelOne: 'Angel One',
  dhan: 'Dhan',
  upstox: 'Upstox',
};

const handleError = (res, statusCode, message, error = null) => {
  console.error(message, error?.message || '');
  return res.status(statusCode).json({ success: false, message, error: error?.message });
};

const validateBrokerId = (brokerId, res) => {
  if (!brokerApiConfig[brokerId]) {
    return handleError(res, 400, 'Invalid broker ID');
  }
  return true;
};

const isTokenExpired = (lastUpdated) => {
  return (new Date() - new Date(lastUpdated)) > 6 * 60 * 60 * 1000; // 6 hours
};

const fetchHoldingsFromBroker = async (brokerId, tokenData) => {
  try {
    const brokerConfig = brokerApiConfig[brokerId];
    const headers = await getDynamicHeaders(brokerId, tokenData);
    
    const response = await axios.get(`${brokerConfig.baseUrl}${brokerConfig.endpoints.holdings}`, {
      headers,
    });
    return parseHoldingsResponse(brokerId, response.data);
  } catch (error) {
    throw new Error(`Failed to fetch holdings from ${brokerNames[brokerId]}: ${error.message}`);
  }
};

/**
 * Parse holdings response from brokers
 */
const parseHoldingsResponse = (brokerId, responseData) => {
  const mappings = {
    angelOne: (item) => ({
      symbol: item.tradingSymbol,
      exchange: item.exchange,
      isin: item.isin,
      quantity: item.quantity,
      averagePrice: item.averagePrice,
      lastPrice: item.ltp,
      pnl: item.pnl,
      pnlPercentage: item.pnlPercentage,
      product: item.product,
    }),
    dhan: (item) => ({
      symbol: item.symbol,
      exchange: item.exchange,
      isin: item.isin,
      quantity: item.quantity,
      averagePrice: item.avgPrice,
      lastPrice: item.lastPrice,
      pnl: item.unrealizedPnl,
      pnlPercentage: ((item.unrealizedPnl / (item.avgPrice * item.quantity)) * 100).toFixed(2),
      product: item.product,
    }),
    upstox: (item) => ({
      symbol: item.symbol,
      exchange: item.exchange,
      isin: item.isin,
      quantity: item.quantity,
      averagePrice: item.averageBuyPrice,
      lastPrice: item.lastPrice,
      pnl: item.unrealizedPnl,
      pnlPercentage: item.unrealizedPnlPercentage,
      product: item.product,
    }),
  };

  return responseData.data?.map(mappings[brokerId]) || [];
};

/**
 * Save or update holdings in Asset model
 * @param {string} userId - User ID
 * @param {string} brokerId - Broker ID
 * @param {Array} holdings - Array of holdings from broker
 */
const saveHoldingsToAssets = async (userId, brokerId, brokerName, holdings) => {
  try {
    const bulkOps = [];
    const now = new Date();
    
    for (const holding of holdings) {
      const currentValue = holding.quantity * holding.lastPrice;
      
      // Create filter to find existing asset
      const filter = {
        user: userId,
        type: 'equity',
        symbol: holding.symbol,
        exchange: holding.exchange,
        "broker.id": brokerId
      };
      
      // Create update or insert document
      const update = {
        $set: {
          name: holding.symbol,
          quantity: holding.quantity,
          averagePrice: holding.averagePrice,
          currentValue: currentValue,
          broker: {
            id: brokerId,
            name: brokerName
          },
          stockDetails: {
            product: holding.product,
            pnl: holding.pnl,
            pnlPercentage: holding.pnlPercentage
          },
          isin: holding.isin,
          lastUpdated: now
        },
        $push: {
          historicalValues: {
            date: now,
            value: currentValue,
            price: holding.lastPrice
          }
        }
      };
      
      // If too many historical values, keep only the last 100
      const trim = {
        $push: {
          historicalValues: {
            $each: [{
              date: now,
              value: currentValue,
              price: holding.lastPrice
            }],
            $slice: -100 // Keep only the most recent 100 entries
          }
        }
      };
      
      bulkOps.push({
        updateOne: {
          filter,
          update: {
            ...update,
            $setOnInsert: {
              user: userId,
              type: 'equity',
              createdAt: now
            }
          },
          upsert: true
        }
      });
    }
    
    if (bulkOps.length > 0) {
      await Asset.bulkWrite(bulkOps);
    }
    
    const symbols = holdings.map(h => h.symbol);
    await Asset.updateMany(
      { 
        user: userId, 
        "broker.id": brokerId, 
        type: 'equity', 
        symbol: { $nin: symbols } 
      },
      { 
        $set: { 
          quantity: 0,
          currentValue: 0,
          "stockDetails.pnl": 0,
          "stockDetails.pnlPercentage": 0,
          lastUpdated: now
        } 
      }
    );
    
  } catch (error) {
    console.error(`Failed to save holdings to assets: ${error.message}`);
    throw error;
  }
};

/**
 * Get Broker Holdings
 */
const getBrokerHoldings = async (req, res) => {
  try {
    const { brokerId } = req.params;
    if (!validateBrokerId(brokerId, res)) return;

    const userId = req.user.id;
    const credential = await Broker.findOne({ userId, brokerId });

    console.log("credential", credential);
    if (!credential) return handleError(res, 404, `No credentials found for broker ${brokerId}`);

    const decryptedData = JSON.parse(decryptData(credential.encryptedData));

    console.log("decryptedData", decryptedData);

    if (isTokenExpired(decryptedData.lastUpdated)) return handleError(res, 401, 'Session expired. Please login again.');

    const holdings = await fetchHoldingsFromBroker(brokerId, decryptedData.token);
    
    // Save holdings to asset model
    await saveHoldingsToAssets(userId, brokerId, brokerNames[brokerId], holdings);

    return res.status(200).json({
      success: true,
      data: { brokerId, brokerName: brokerNames[brokerId], holdings },
    });
  } catch (error) {
    return handleError(res, 500, 'Error fetching broker holdings', error);
  }
};

/**
 * Get all user assets from all brokers and manual entries
 */
const getAllAssets = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const assets = await Asset.find({ user: userId })
      .sort({ type: 1, "broker.name": 1, name: 1 })
      .lean();
    
    // Group assets by type
    const groupedAssets = {
      equity: assets.filter(a => a.type === 'equity'),
      crypto: assets.filter(a => a.type === 'crypto'),
      property: assets.filter(a => a.type === 'property'),
      other: assets.filter(a => a.type === 'other')
    };
    
    // Calculate totals
    const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    
    return res.status(200).json({
      success: true,
      data: {
        assets: groupedAssets,
        totalValue,
        assetCount: assets.length
      }
    });
  } catch (error) {
    return handleError(res, 500, 'Error fetching assets', error);
  }
};

/**
 * Add or update a manual asset
 */
const manageManualAsset = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, type, name, value, description, purchaseDate, quantity, averagePrice } = req.body;
    
    if (!type || !name || value === undefined) {
      return handleError(res, 400, 'Missing required asset parameters');
    }
    
    let asset;
    const now = new Date();
    
    if (id) {
      // Update existing asset
      asset = await Asset.findOneAndUpdate(
        { _id: id, user: userId },
        {
          $set: {
            type,
            name,
            currentValue: value,
            description,
            purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
            quantity,
            averagePrice,
            lastUpdated: now
          },
          $push: {
            historicalValues: {
              date: now,
              value: value,
              price: quantity > 0 ? value / quantity : 0
            }
          }
        },
        { new: true }
      );
      
      if (!asset) return handleError(res, 404, 'Asset not found');
    } else {
      // Create new asset
      asset = new Asset({
        user: userId,
        type,
        name,
        currentValue: value,
        description,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        quantity,
        averagePrice,
        broker: {
          id: 'manual',
          name: 'Manual Entry'
        },
        historicalValues: [{
          date: now,
          value: value,
          price: quantity > 0 ? value / quantity : 0
        }]
      });
      
      await asset.save();
    }
    
    return res.status(200).json({
      success: true,
      message: id ? 'Asset updated successfully' : 'Asset added successfully',
      data: asset
    });
  } catch (error) {
    return handleError(res, 500, 'Error managing asset', error);
  }
};

/**
 * Delete an asset
 */
const deleteAsset = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const asset = await Asset.findOneAndDelete({ _id: id, user: userId });
    
    if (!asset) return handleError(res, 404, 'Asset not found');
    
    return res.status(200).json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    return handleError(res, 500, 'Error deleting asset', error);
  }
};

/**
 * Place Broker Order
 */
const placeBrokerOrder = async (req, res) => {
  try {
    const { brokerId } = req.params;
    if (!validateBrokerId(brokerId, res)) return;

    const { symbol, exchange, quantity, price, orderType, transactionType, product } = req.body;
    if (!symbol || !exchange || !quantity || !orderType || !transactionType) {
      return handleError(res, 400, 'Missing required order parameters');
    }

    const userId = req.user.id;
    const credential = await Broker.findOne({ userId, brokerId });

    if (!credential) return handleError(res, 404, `No credentials found for broker ${brokerId}`);

    const decryptedData = JSON.parse(decryptData(credential.encryptedData));
    if (isTokenExpired(decryptedData.lastUpdated)) return handleError(res, 401, 'Session expired. Please login again.');

    if (transactionType.toLowerCase() === 'sell') {
      const holdings = await fetchHoldingsFromBroker(brokerId, decryptedData.tokenData);
      const holdingExists = holdings.some((holding) => holding.symbol === symbol && holding.exchange === exchange && holding.quantity >= quantity);
      if (!holdingExists) return handleError(res, 400, `Insufficient holdings of ${symbol} for sell order`);
    }

    const orderPayload = { symbol, exchange, quantity, price, orderType, transactionType, product };
    const headers = await getDynamicHeaders(brokerId, decryptedData.tokenData);
    
    const response = await axios.post(`${brokerApiConfig[brokerId].baseUrl}${brokerApiConfig[brokerId].endpoints.order}`, orderPayload, {
      headers,
    });

    return res.status(200).json({
      success: true,
      message: `${transactionType} order placed successfully with ${brokerNames[brokerId]}`,
      data: response.data,
    });
  } catch (error) {
    return handleError(res, 500, 'Failed to place order', error);
  }
};

/**
 * Get all stock holdings from all connected brokers
 */
const getAllBrokerHoldings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all broker credentials for the user
    const brokerCredentials = await Broker.find({ userId });
    
    if (brokerCredentials.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No broker accounts connected',
        data: {
          holdings: [],
          totalValue: 0,
          brokerCount: 0
        }
      });
    }
    
    const allHoldings = [];
    const brokerSummary = [];
    let expiredSessions = [];
    let successCount = 0;
    
    // Fetch holdings from each broker
    for (const credential of brokerCredentials) {
      const brokerId = credential.brokerId;
      
      // Skip if broker configuration doesn't exist
      if (!brokerApiConfig[brokerId]) continue;
      
      try {
        const decryptedData = JSON.parse(decryptData(credential.encryptedData));
        
        // Check if token is expired
        if (isTokenExpired(decryptedData.lastUpdated)) {
          expiredSessions.push(brokerNames[brokerId]);
          continue;
        }
        
        // Fetch holdings from the broker
        const holdings = await fetchHoldingsFromBroker(brokerId, decryptedData.tokenData);
        
        // Save holdings to database
        await saveHoldingsToAssets(userId, brokerId, brokerNames[brokerId], holdings);
        
        // Calculate broker portfolio value
        const portfolioValue = holdings.reduce((sum, holding) => sum + (holding.quantity * holding.lastPrice), 0);
        
        // Add broker summary
        brokerSummary.push({
          brokerId,
          brokerName: brokerNames[brokerId],
          holdingsCount: holdings.length,
          portfolioValue
        });
        
        // Add holdings with broker information
        const holdingsWithBroker = holdings.map(holding => ({
          ...holding,
          broker: {
            id: brokerId,
            name: brokerNames[brokerId]
          }
        }));
        
        allHoldings.push(...holdingsWithBroker);
        successCount++;
      } catch (error) {
        console.error(`Error fetching holdings from ${brokerNames[brokerId]}: ${error.message}`);
        // Continue to next broker if one fails
      }
    }
    
    // Calculate total value across all brokers
    const totalValue = allHoldings.reduce((sum, holding) => sum + (holding.quantity * holding.lastPrice), 0);
    
    // Generate response message
    let message = 'Holdings fetched successfully';
    if (expiredSessions.length > 0) {
      message += `. Note: Session expired for ${expiredSessions.join(', ')}. Please login again.`;
    }
    
    return res.status(200).json({
      success: true,
      message,
      data: {
        holdings: allHoldings,
        brokerSummary,
        totalValue,
        brokerCount: successCount
      }
    });
  } catch (error) {
    return handleError(res, 500, 'Error fetching holdings from brokers', error);
  }
};

/**
 * Get consolidated holdings view (merged holdings across brokers)
 */
const getConsolidatedHoldings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all equity assets from the database
    const assets = await Asset.find({ 
      user: userId, 
      type: 'equity', 
      quantity: { $gt: 0 } 
    }).lean();
    
    // Aggregate holdings by symbol and exchange
    const holdingsMap = {};
    
    assets.forEach(asset => {
      const key = `${asset.symbol}_${asset.exchange}`;
      
      if (!holdingsMap[key]) {
        holdingsMap[key] = {
          symbol: asset.symbol,
          exchange: asset.exchange,
          isin: asset.isin,
          quantity: 0,
          investmentValue: 0,
          currentValue: 0,
          brokers: []
        };
      }
      
      // Update consolidated holding data
      holdingsMap[key].quantity += asset.quantity;
      const investmentValue = asset.averagePrice * asset.quantity;
      holdingsMap[key].investmentValue += investmentValue;
      holdingsMap[key].currentValue += asset.currentValue;
      
      // Add broker info if not already included
      const brokerInfo = {
        id: asset.broker.id,
        name: asset.broker.name,
        quantity: asset.quantity,
        averagePrice: asset.averagePrice,
        currentValue: asset.currentValue,
        pnl: asset.stockDetails?.pnl || (asset.currentValue - investmentValue),
        pnlPercentage: asset.stockDetails?.pnlPercentage || 
          (((asset.currentValue - investmentValue) / investmentValue) * 100).toFixed(2)
      };
      
      holdingsMap[key].brokers.push(brokerInfo);
    });
    
    // Convert to array and calculate performance metrics
    const consolidatedHoldings = Object.values(holdingsMap).map(holding => {
      const averagePrice = holding.investmentValue / holding.quantity;
      const pnl = holding.currentValue - holding.investmentValue;
      const pnlPercentage = ((pnl / holding.investmentValue) * 100).toFixed(2);
      
      return {
        ...holding,
        averagePrice,
        pnl,
        pnlPercentage,
        lastUpdated: new Date()
      };
    });
    
    // Calculate total portfolio metrics
    const totalInvestment = consolidatedHoldings.reduce((sum, h) => sum + h.investmentValue, 0);
    const totalCurrentValue = consolidatedHoldings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalPnl = totalCurrentValue - totalInvestment;
    const totalPnlPercentage = totalInvestment > 0 ? 
      ((totalPnl / totalInvestment) * 100).toFixed(2) : 0;
    
    return res.status(200).json({
      success: true,
      data: {
        holdings: consolidatedHoldings,
        summary: {
          totalInvestment,
          totalCurrentValue,
          totalPnl,
          totalPnlPercentage,
          holdingsCount: consolidatedHoldings.length
        }
      }
    });
  } catch (error) {
    return handleError(res, 500, 'Error fetching consolidated holdings', error);
  }
};

module.exports = {
  getBrokerHoldings,
  getAllAssets,
  getAllBrokerHoldings,
  getConsolidatedHoldings,
  deleteAsset,
  placeBrokerOrder,
  manageManualAsset
};