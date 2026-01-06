import axios from 'axios';
import { TokenPrice } from '../types';

export class PriceService {
  private coingeckoBaseUrl = 'https://api.coingecko.com/api/v3';
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private cacheDuration = 60000; // 1 minute cache

  // Token address to CoinGecko ID mapping for BSC
  private tokenIdMap: Record<string, string> = {
    '0x55d398326f99059ff775485246999027b3197955': 'tether', // USDT
    '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': 'usd-coin', // USDC
    '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': 'wbnb', // WBNB
    '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c': 'bitcoin-bep2', // BTCB
    '0x2170ed0880ac9a755fd29b2688956bd959f933f8': 'ethereum', // ETH
  };

  // Symbol to CoinGecko ID mapping
  private symbolIdMap: Record<string, string> = {
    'USDT': 'tether',
    'USDC': 'usd-coin',
    'WBNB': 'wbnb',
    'BTCB': 'bitcoin-bep2',
    'ETH': 'ethereum',
    'BNB': 'wbnb',
    'FDUSD': 'first-digital-usd',
    'CAKE': 'pancakeswap-token',
    'wstETH': 'wrapped-steth',
  };

  /**
   * Get CoinGecko ID from address or symbol
   */
  private getCoinGeckoId(addressOrSymbol: string): string | undefined {
    // Check if it's a symbol first
    if (this.symbolIdMap[addressOrSymbol.toUpperCase()]) {
      return this.symbolIdMap[addressOrSymbol.toUpperCase()];
    }
    // Otherwise treat as address
    return this.tokenIdMap[addressOrSymbol.toLowerCase()];
  }

  /**
   * Get current price for a token (accepts address or symbol)
   */
  async getCurrentPrice(addressOrSymbol: string): Promise<number> {
    const cacheKey = `${addressOrSymbol}-current`;
    const cached = this.priceCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.price;
    }

    try {
      const coingeckoId = this.getCoinGeckoId(addressOrSymbol);

      if (!coingeckoId) {
        console.warn(`No CoinGecko ID found for token ${addressOrSymbol}, defaulting to $1`);
        return 1;
      }

      const response = await axios.get(`${this.coingeckoBaseUrl}/simple/price`, {
        params: {
          ids: coingeckoId,
          vs_currencies: 'usd',
        },
      });

      const price = response.data[coingeckoId]?.usd || 0;

      this.priceCache.set(cacheKey, { price, timestamp: Date.now() });

      return price;
    } catch (error) {
      console.error(`Error fetching current price for ${addressOrSymbol}:`, error);
      return 0;
    }
  }

  /**
   * Get historical price for a token at a specific timestamp (accepts address or symbol)
   */
  async getHistoricalPrice(addressOrSymbol: string, timestamp: number): Promise<number> {
    try {
      const coingeckoId = this.getCoinGeckoId(addressOrSymbol);

      if (!coingeckoId) {
        console.warn(`No CoinGecko ID found for token ${addressOrSymbol}, defaulting to $1`);
        return 1;
      }

      // Convert timestamp to date format (DD-MM-YYYY)
      const date = new Date(timestamp * 1000);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const dateStr = `${day}-${month}-${year}`;

      const response = await axios.get(
        `${this.coingeckoBaseUrl}/coins/${coingeckoId}/history`,
        {
          params: {
            date: dateStr,
          },
        }
      );

      const price = response.data.market_data?.current_price?.usd || 0;

      // Add small delay to avoid rate limiting
      await this.sleep(1200);

      return price;
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.warn('Rate limited by CoinGecko, using current price as fallback');
        return this.getCurrentPrice(addressOrSymbol);
      }
      console.error(`Error fetching historical price for ${addressOrSymbol}:`, error);
      return 0;
    }
  }

  /**
   * Get multiple current prices at once
   */
  async getMultiplePrices(tokenAddresses: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();

    const coingeckoIds = tokenAddresses
      .map(addr => this.tokenIdMap[addr.toLowerCase()])
      .filter(id => id !== undefined);

    if (coingeckoIds.length === 0) {
      return prices;
    }

    try {
      const response = await axios.get(`${this.coingeckoBaseUrl}/simple/price`, {
        params: {
          ids: coingeckoIds.join(','),
          vs_currencies: 'usd',
        },
      });

      tokenAddresses.forEach(addr => {
        const coingeckoId = this.tokenIdMap[addr.toLowerCase()];
        if (coingeckoId && response.data[coingeckoId]) {
          prices.set(addr, response.data[coingeckoId].usd);
        }
      });
    } catch (error) {
      console.error('Error fetching multiple prices:', error);
    }

    return prices;
  }

  /**
   * Helper to add delay (for rate limiting)
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
