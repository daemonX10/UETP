const WebSocket = require('ws');
const EventEmitter = require('events');

class MarketDataService extends EventEmitter {
  constructor() {
    super();
    this.clients = new Set();
    this.marketData = new Map();
    this.updateInterval = null;
    this.isRunning = false;
  }

  // Initialize WebSocket server
  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/market-data'
    });

    this.wss.on('connection', (ws, req) => {
      console.log('📡 New WebSocket connection established');
      this.clients.add(ws);

      // Send initial market data
      ws.send(JSON.stringify({
        type: 'INITIAL_DATA',
        data: this.getMarketSnapshot()
      }));

      // Handle client messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log('📡 WebSocket connection closed');
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    this.startMarketDataSimulation();
    console.log('🔥 WebSocket Market Data Service initialized');
  }

  // Handle incoming client messages
  handleClientMessage(ws, data) {
    switch (data.type) {
      case 'SUBSCRIBE':
        this.handleSubscription(ws, data.symbols);
        break;
      case 'UNSUBSCRIBE':
        this.handleUnsubscription(ws, data.symbols);
        break;
      case 'PING':
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  // Handle symbol subscriptions
  handleSubscription(ws, symbols) {
    if (!ws.subscriptions) {
      ws.subscriptions = new Set();
    }
    
    symbols.forEach(symbol => {
      ws.subscriptions.add(symbol);
    });

    ws.send(JSON.stringify({
      type: 'SUBSCRIPTION_CONFIRMED',
      symbols: Array.from(ws.subscriptions)
    }));
  }

  // Handle symbol unsubscriptions
  handleUnsubscription(ws, symbols) {
    if (ws.subscriptions) {
      symbols.forEach(symbol => {
        ws.subscriptions.delete(symbol);
      });
    }

    ws.send(JSON.stringify({
      type: 'UNSUBSCRIPTION_CONFIRMED',
      symbols: symbols
    }));
  }

  // Get current market snapshot
  getMarketSnapshot() {
    const popularStocks = [
      'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR',
      'ICICIBANK', 'KOTAKBANK', 'BHARTIARTL', 'ITC', 'SBIN',
      'BAJFINANCE', 'ASIANPAINT', 'DMART', 'LTIM', 'TITAN'
    ];

    const snapshot = {};
    
    popularStocks.forEach(symbol => {
      if (!this.marketData.has(symbol)) {
        // Initialize with realistic Indian stock prices
        const basePrice = this.getBasePriceForSymbol(symbol);
        this.marketData.set(symbol, {
          symbol,
          price: basePrice,
          change: 0,
          changePercent: 0,
          volume: Math.floor(Math.random() * 1000000) + 100000,
          high: basePrice * 1.02,
          low: basePrice * 0.98,
          open: basePrice,
          previousClose: basePrice,
          lastUpdated: Date.now()
        });
      }
      snapshot[symbol] = this.marketData.get(symbol);
    });

    return snapshot;
  }

  // Get realistic base prices for Indian stocks
  getBasePriceForSymbol(symbol) {
    const basePrices = {
      'RELIANCE': 2450.50,
      'TCS': 3850.75,
      'HDFCBANK': 1520.25,
      'INFY': 1450.60,
      'HINDUNILVR': 2650.80,
      'ICICIBANK': 950.45,
      'KOTAKBANK': 1750.90,
      'BHARTIARTL': 850.30,
      'ITC': 420.15,
      'SBIN': 580.65,
      'BAJFINANCE': 6850.40,
      'ASIANPAINT': 3250.70,
      'DMART': 4200.85,
      'LTIM': 5450.95,
      'TITAN': 3150.55
    };
    
    return basePrices[symbol] || (Math.random() * 1000 + 100);
  }

  // Start market data simulation
  startMarketDataSimulation() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Update market data every 2 seconds
    this.updateInterval = setInterval(() => {
      this.updateMarketData();
      this.broadcastMarketData();
    }, 2000);

    console.log('📈 Market data simulation started');
  }

  // Stop market data simulation
  stopMarketDataSimulation() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    console.log('📉 Market data simulation stopped');
  }

  // Update market data with realistic fluctuations
  updateMarketData() {
    this.marketData.forEach((data, symbol) => {
      // Generate realistic price movements
      const volatility = 0.02; // 2% max change per update
      const changePercent = (Math.random() - 0.5) * volatility;
      const newPrice = data.price * (1 + changePercent);
      
      // Update the data
      const updatedData = {
        ...data,
        price: Math.round(newPrice * 100) / 100,
        change: Math.round((newPrice - data.previousClose) * 100) / 100,
        changePercent: Math.round(((newPrice - data.previousClose) / data.previousClose) * 10000) / 100,
        volume: data.volume + Math.floor(Math.random() * 10000),
        high: Math.max(data.high, newPrice),
        low: Math.min(data.low, newPrice),
        lastUpdated: Date.now()
      };

      this.marketData.set(symbol, updatedData);
    });
  }

  // Broadcast market data to all connected clients
  broadcastMarketData() {
    if (this.clients.size === 0) return;

    const marketUpdate = {
      type: 'MARKET_UPDATE',
      data: Array.from(this.marketData.values()),
      timestamp: Date.now()
    };

    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        // Send only subscribed symbols or all if no subscription
        let dataToSend = marketUpdate.data;
        
        if (ws.subscriptions && ws.subscriptions.size > 0) {
          dataToSend = marketUpdate.data.filter(stock => 
            ws.subscriptions.has(stock.symbol)
          );
        }

        ws.send(JSON.stringify({
          ...marketUpdate,
          data: dataToSend
        }));
      }
    });
  }

  // Get current price for a specific symbol
  getCurrentPrice(symbol) {
    const data = this.marketData.get(symbol);
    return data ? data.price : null;
  }

  // Get market data for multiple symbols
  getMarketData(symbols) {
    if (!symbols || symbols.length === 0) {
      return Array.from(this.marketData.values());
    }
    
    return symbols.map(symbol => this.marketData.get(symbol)).filter(Boolean);
  }

  // Close all connections and cleanup
  shutdown() {
    this.stopMarketDataSimulation();
    
    if (this.wss) {
      this.clients.forEach(ws => {
        ws.close();
      });
      this.wss.close();
    }
    
    console.log('🔌 Market Data Service shutdown complete');
  }
}

module.exports = MarketDataService;
