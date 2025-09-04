// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Types
interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// API client class
class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  // Set authentication token
  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      // Also set an expiration timestamp (24 hours from now)
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 24);
      localStorage.setItem('auth_token_expiry', expiration.toISOString());
    }
  }

  // Get authentication token
  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const expiry = localStorage.getItem('auth_token_expiry');
      
      // Check if token has expired
      if (token && expiry) {
        const expirationDate = new Date(expiry);
        if (new Date() > expirationDate) {
          // Token has expired, clear it
          this.clearToken();
          return null;
        }
        return token;
      }
      return token;
    }
    return null;
  }

  // Clear authentication token
  clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token_expiry');
      localStorage.removeItem('user_data'); // Clear any cached user data
    }
  }

  // Make HTTP request
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  get<T = any>(endpoint: string, params: Record<string, any> = {}): Promise<ApiResponse<T>> {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  // POST request
  post<T = any>(endpoint: string, data: any = {}): Promise<ApiResponse<T>> {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  // PUT request
  put<T = any>(endpoint: string, data: any = {}): Promise<ApiResponse<T>> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  // DELETE request
  delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create a single instance
const apiClient = new ApiClient();

// Authentication API
export const authAPI = {
  register: (userData: any) => apiClient.post('/auth/register', userData),
  login: (credentials: any) => apiClient.post('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  verifyEmail: (data: any) => apiClient.post('/auth/verify-email', data),
  resendVerification: (email: string) => apiClient.post('/auth/resend-verification', { email }),
  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (data: any) => apiClient.post('/auth/reset-password', data),
  getCurrentUser: () => apiClient.get('/auth/me'),
  updateProfile: (data: any) => apiClient.put('/auth/profile', data),
  changePassword: (data: any) => apiClient.put('/auth/change-password', data),
};

// Market Data API
export const marketAPI = {
  getSnapshot: () => apiClient.get('/market/snapshot'),
  getMarketData: (symbols?: string[]) => apiClient.get('/market/data', { symbols: symbols?.join(',') }),
  getCurrentPrice: (symbol: string) => apiClient.get(`/market/price/${symbol}`),
  getIndices: () => apiClient.get('/market/indices'),
  getTopGainers: () => apiClient.get('/market/gainers'),
  getTopLosers: () => apiClient.get('/market/losers'),
  getMostActive: () => apiClient.get('/market/active'),
  searchStocks: (query: string) => apiClient.get('/market/search', { query }),
  
  // Enhanced Stock Detail APIs
  getStockDetails: (symbol: string) => apiClient.get(`/market/stock/${symbol}/details`),
  getStockHistory: (symbol: string, period: string = '1M') => apiClient.get(`/market/stock/${symbol}/history`, { period }),
  getStockNews: (symbol: string) => apiClient.get(`/market/stock/${symbol}/news`),
  getStockFinancials: (symbol: string) => apiClient.get(`/market/stock/${symbol}/financials`),
  getStockAnalysis: (symbol: string) => apiClient.get(`/market/stock/${symbol}/analysis`),
  getStockPeers: (symbol: string) => apiClient.get(`/market/stock/${symbol}/peers`),
  
  // Technical Analysis
  getTechnicalIndicators: (symbol: string, indicators: string[]) => 
    apiClient.get(`/market/stock/${symbol}/technical`, { indicators: indicators.join(',') }),
  getChartData: (symbol: string, interval: string = '1D', period: string = '1M') => 
    apiClient.get(`/market/stock/${symbol}/chart`, { interval, period }),
};

// Portfolio API
export const portfolioAPI = {
  getPortfolio: () => apiClient.get('/portfolio'),
  addHolding: (data: any) => apiClient.post('/portfolio/holdings/add', data),
  removeHolding: (data: any) => apiClient.post('/portfolio/holdings/remove', data),
  getAnalytics: () => apiClient.get('/portfolio/analytics'),
  getWatchlist: () => apiClient.get('/portfolio/watchlist'),
  addToWatchlist: (data: any) => apiClient.post('/portfolio/watchlist/add', data),
  removeFromWatchlist: (symbol: string) => apiClient.delete(`/portfolio/watchlist/${symbol}`),
};

// Trading API
export const tradingAPI = {
  placeOrder: (orderData: any) => apiClient.post('/trading/orders/place', orderData),
  getOrders: (params?: any) => apiClient.get('/trading/orders', params),
  getOrderById: (orderId: string) => apiClient.get(`/trading/orders/${orderId}`),
  modifyOrder: (orderId: string, data: any) => apiClient.put(`/trading/orders/${orderId}/modify`, data),
  cancelOrder: (orderId: string) => apiClient.delete(`/trading/orders/${orderId}/cancel`),
  getTransactions: (params?: any) => apiClient.get('/trading/transactions', params),
  getTradingStats: (params?: any) => apiClient.get('/trading/stats', params),
};

// Broker API
export const brokerAPI = {
  loginAngelOne: (credentials: any) => apiClient.post('/broker/login/angelone', credentials),
  loginDhan: (credentials: any) => apiClient.post('/broker/login/dhan', credentials),
  loginUpstox: (credentials: any) => apiClient.post('/broker/login/upstox', credentials),
  getBrokerHoldings: (brokerId: string) => apiClient.get(`/broker/holdings/${brokerId}`),
  getAllAssets: () => apiClient.get('/broker/assets'),
  getAllBrokerHoldings: () => apiClient.get('/broker/holdings'),
  getConsolidatedHoldings: () => apiClient.get('/broker/consolidated-holdings'),
  deleteAsset: (assetId: string) => apiClient.delete(`/broker/deleteAsset/${assetId}`),
  placeBrokerOrder: (orderData: any) => apiClient.post('/broker/order', orderData),
  manageManualAsset: (assetData: any) => apiClient.post('/broker/manageManualAsset', assetData),
};

// WebSocket client for real-time market data
export class MarketDataWebSocket {
  public ws: WebSocket | null;
  public isConnected: boolean;
  private subscribers: Map<string, any>;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;
  private reconnectInterval: number;

  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000; // 5 seconds
  }

  connect() {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/ws/market-data';
      console.log('🔗 Attempting to connect to WebSocket:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('📡 WebSocket connected to market data service');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.sendPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('📡 WebSocket connection closed', event.code, event.reason);
        this.isConnected = false;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('📡 WebSocket error:', error);
        this.isConnected = false;
      };

      // Set a timeout for connection
      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.warn('⚠️ WebSocket connection timeout');
          this.ws.close();
        }
      }, 10000); // 10 second timeout

    } catch (error) {
      console.error('❌ Error creating WebSocket connection:', error);
      this.isConnected = false;
      throw error;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  subscribe(symbols: string[], callback: (data: any) => void): string {
    const subscriptionId = Math.random().toString(36).substr(2, 9);
    this.subscribers.set(subscriptionId, { symbols, callback });

    if (this.isConnected) {
      this.send({
        type: 'SUBSCRIBE',
        symbols: symbols
      });
    }

    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscribers.get(subscriptionId);
    if (subscription) {
      this.subscribers.delete(subscriptionId);
      
      if (this.isConnected) {
        this.send({
          type: 'UNSUBSCRIBE',
          symbols: subscription.symbols
        });
      }
    }
  }

  send(data: any): void {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendPing(): void {
    if (this.isConnected) {
      this.send({ type: 'PING' });
      
      // Schedule next ping
      setTimeout(() => {
        if (this.isConnected) {
          this.sendPing();
        }
      }, 30000); // Ping every 30 seconds
    }
  }

  handleMessage(data: any): void {
    switch (data.type) {
      case 'INITIAL_DATA':
      case 'MARKET_UPDATE':
        this.notifySubscribers(data.data);
        break;
      case 'PONG':
        // Handle pong response
        break;
      case 'SUBSCRIPTION_CONFIRMED':
        console.log('✅ Subscribed to symbols:', data.symbols);
        break;
      case 'UNSUBSCRIPTION_CONFIRMED':
        console.log('❌ Unsubscribed from symbols:', data.symbols);
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }

  notifySubscribers(marketData: any): void {
    this.subscribers.forEach((subscription) => {
      try {
        subscription.callback(marketData);
      } catch (error) {
        console.error('Error in subscription callback:', error);
      }
    });
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }
}

// Export the API client instance and token management
export { apiClient };

// Token management utilities
export const tokenManager = {
  setToken: (token: string) => apiClient.setToken(token),
  getToken: () => apiClient.getToken(),
  clearToken: () => apiClient.clearToken(),
  isAuthenticated: () => !!apiClient.getToken(),
};

export default apiClient;
