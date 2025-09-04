// Upstox API Integration Service
// This service handles all API calls to Upstox API v2

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  high: number;
  low: number;
  open: number;
  close: number;
}

export interface HistoricalData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface InstrumentData {
  instrument_key: string;
  name: string;
  trading_symbol: string;
  exchange: string;
  segment: string;
  instrument_type: string;
  lot_size: number;
  tick_size: number;
}

class UpstoxService {
  private baseURL = 'https://api.upstox.com/v2';
  private apiHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  // For demo purposes, we're using mock data
  // In production, you would use actual Upstox API with authentication
  private mockData = {
    HDFCBANK: {
      symbol: 'HDFCBANK',
      name: 'HDFC Bank Limited',
      price: 1630.5,
      change: 19.30,
      changePercent: 1.2,
      volume: '2.4M',
      marketCap: '₹8.9L Cr',
      high: 1645.0,
      low: 1620.0,
      open: 1625.0,
      close: 1611.2,
    },
    RELIANCE: {
      symbol: 'RELIANCE',
      name: 'Reliance Industries Limited',
      price: 2450.8,
      change: -19.6,
      changePercent: -0.8,
      volume: '1.8M',
      marketCap: '₹16.5L Cr',
      high: 2470.0,
      low: 2440.0,
      open: 2465.0,
      close: 2470.4,
    },
    INFY: {
      symbol: 'INFY',
      name: 'Infosys Limited',
      price: 1450.2,
      change: 7.2,
      changePercent: 0.5,
      volume: '3.2M',
      marketCap: '₹6.1L Cr',
      high: 1455.0,
      low: 1440.0,
      open: 1445.0,
      close: 1443.0,
    },
    TCS: {
      symbol: 'TCS',
      name: 'Tata Consultancy Services',
      price: 3500.1,
      change: 72.1,
      changePercent: 2.1,
      volume: '1.5M',
      marketCap: '₹12.8L Cr',
      high: 3510.0,
      low: 3485.0,
      open: 3490.0,
      close: 3428.0,
    },
  };

  /**
   * Get live market data for a stock
   * @param instrumentKey - Upstox instrument key format: {EXCHANGE}_{SEGMENT}|{ISIN}
   */
  async getLiveMarketData(instrumentKey: string): Promise<StockData | null> {
    try {
      // In production, uncomment this for actual API call:
      // const response = await fetch(`${this.baseURL}/market-data/quote/${instrumentKey}`, {
      //   headers: this.apiHeaders
      // });
      // const data = await response.json();
      // return this.parseStockData(data);

      // For demo, return mock data
      const symbol = this.extractSymbolFromKey(instrumentKey);
      return this.mockData[symbol as keyof typeof this.mockData] || null;
    } catch (error) {
      console.error('Error fetching live market data:', error);
      return null;
    }
  }

  /**
   * Get historical candle data
   * @param instrumentKey - Upstox instrument key
   * @param interval - 1minute, 5minute, 15minute, 30minute, 60minute, 1day, 1week, 1month
   * @param fromDate - Start date in YYYY-MM-DD format
   * @param toDate - End date in YYYY-MM-DD format
   */
  async getHistoricalData(
    instrumentKey: string, 
    interval: string, 
    fromDate: string, 
    toDate: string
  ): Promise<HistoricalData[]> {
    try {
      // In production, uncomment this for actual API call:
      // const response = await fetch(
      //   `${this.baseURL}/historical-candle/${instrumentKey}/${interval}/${toDate}/${fromDate}`,
      //   { headers: this.apiHeaders }
      // );
      // const data = await response.json();
      // return this.parseHistoricalData(data);

      // For demo, return mock historical data
      return this.generateMockHistoricalData(interval);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }

  /**
   * Get intraday data
   * @param instrumentKey - Upstox instrument key
   */
  async getIntradayData(instrumentKey: string): Promise<HistoricalData[]> {
    try {
      // In production, uncomment this for actual API call:
      // const response = await fetch(`${this.baseURL}/market-data/candle/${instrumentKey}`, {
      //   headers: this.apiHeaders
      // });
      // const data = await response.json();
      // return this.parseHistoricalData(data);

      // For demo, return mock intraday data
      return this.generateMockHistoricalData('5minute');
    } catch (error) {
      console.error('Error fetching intraday data:', error);
      return [];
    }
  }

  /**
   * Get instruments list for an exchange
   * @param exchange - NSE_EQ, BSE_EQ, etc.
   */
  async getInstruments(exchange: string): Promise<InstrumentData[]> {
    try {
      // In production, uncomment this for actual API call:
      // const response = await fetch(`${this.baseURL}/instruments/${exchange}`, {
      //   headers: this.apiHeaders
      // });
      // const data = await response.json();
      // return data;

      // For demo, return mock instruments
      return this.generateMockInstruments(exchange);
    } catch (error) {
      console.error('Error fetching instruments:', error);
      return [];
    }
  }

  /**
   * Search for stocks/instruments
   * @param query - Search query
   * @param exchange - Optional exchange filter
   */
  async searchInstruments(query: string, exchange?: string): Promise<InstrumentData[]> {
    try {
      const allInstruments = await this.getInstruments(exchange || 'NSE_EQ');
      return allInstruments.filter(instrument => 
        instrument.trading_symbol.toLowerCase().includes(query.toLowerCase()) ||
        instrument.name.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching instruments:', error);
      return [];
    }
  }

  /**
   * Get multiple stocks data at once
   * @param instrumentKeys - Array of instrument keys
   */
  async getMultipleStocksData(instrumentKeys: string[]): Promise<StockData[]> {
    try {
      const promises = instrumentKeys.map(key => this.getLiveMarketData(key));
      const results = await Promise.all(promises);
      return results.filter(data => data !== null) as StockData[];
    } catch (error) {
      console.error('Error fetching multiple stocks data:', error);
      return [];
    }
  }

  // Private helper methods
  private extractSymbolFromKey(instrumentKey: string): string {
    // Extract symbol from instrument key format: NSE_EQ|INE040A01034
    // For demo purposes, we'll use a simple mapping
    const keyMap: { [key: string]: string } = {
      'NSE_EQ|INE040A01034': 'HDFCBANK',
      'NSE_EQ|INE002A01018': 'RELIANCE',
      'NSE_EQ|INE009A01021': 'INFY',
      'NSE_EQ|INE467B01029': 'TCS',
    };
    return keyMap[instrumentKey] || instrumentKey.split('|')[0];
  }

  private generateMockHistoricalData(interval: string): HistoricalData[] {
    const dataPoints = interval === '1day' ? 100 : interval === '1week' ? 50 : 200;
    const basePrice = 1630.5;
    const data: HistoricalData[] = [];
    
    for (let i = 0; i < dataPoints; i++) {
      const variance = (Math.random() - 0.5) * 40;
      const open = basePrice + variance;
      const close = open + (Math.random() - 0.5) * 20;
      const high = Math.max(open, close) + Math.random() * 10;
      const low = Math.min(open, close) - Math.random() * 10;
      
      data.push({
        timestamp: new Date(Date.now() - (dataPoints - i) * 60000).toISOString(),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 100000) + 50000,
      });
    }
    
    return data;
  }

  private generateMockInstruments(exchange: string): InstrumentData[] {
    const instruments: InstrumentData[] = [
      {
        instrument_key: 'NSE_EQ|INE040A01034',
        name: 'HDFC Bank Limited',
        trading_symbol: 'HDFCBANK',
        exchange: 'NSE',
        segment: 'EQ',
        instrument_type: 'EQ',
        lot_size: 1,
        tick_size: 0.05,
      },
      {
        instrument_key: 'NSE_EQ|INE002A01018',
        name: 'Reliance Industries Limited',
        trading_symbol: 'RELIANCE',
        exchange: 'NSE',
        segment: 'EQ',
        instrument_type: 'EQ',
        lot_size: 1,
        tick_size: 0.05,
      },
      {
        instrument_key: 'NSE_EQ|INE009A01021',
        name: 'Infosys Limited',
        trading_symbol: 'INFY',
        exchange: 'NSE',
        segment: 'EQ',
        instrument_type: 'EQ',
        lot_size: 1,
        tick_size: 0.05,
      },
      {
        instrument_key: 'NSE_EQ|INE467B01029',
        name: 'Tata Consultancy Services Limited',
        trading_symbol: 'TCS',
        exchange: 'NSE',
        segment: 'EQ',
        instrument_type: 'EQ',
        lot_size: 1,
        tick_size: 0.05,
      },
    ];

    return instruments.filter(inst => !exchange || inst.exchange === exchange.split('_')[0]);
  }

  // Format instrument key for API calls
  static formatInstrumentKey(exchange: string, segment: string, isin: string): string {
    return `${exchange}_${segment}|${isin}`;
  }

  // Common instrument keys for popular stocks
  static readonly POPULAR_STOCKS = {
    HDFCBANK: 'NSE_EQ|INE040A01034',
    RELIANCE: 'NSE_EQ|INE002A01018',
    INFY: 'NSE_EQ|INE009A01021',
    TCS: 'NSE_EQ|INE467B01029',
    ICICIBANK: 'NSE_EQ|INE090A01013',
    SBIN: 'NSE_EQ|INE062A01020',
    ITC: 'NSE_EQ|INE154A01025',
    HINDUNILVR: 'NSE_EQ|INE030A01027',
    LT: 'NSE_EQ|INE018A01030',
    KOTAKBANK: 'NSE_EQ|INE237A01028',
  };

  // Market hours check
  static isMarketOpen(): boolean {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes;
    
    // Market is closed on weekends
    if (day === 0 || day === 6) return false;
    
    // Market hours: 9:15 AM to 3:30 PM (IST)
    const marketOpen = 9 * 60 + 15; // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM
    
    return currentTime >= marketOpen && currentTime <= marketClose;
  }
}

// Export singleton instance
export const upstoxService = new UpstoxService();
export default UpstoxService;
