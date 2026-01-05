import axios from 'axios';
import { TokenPrice } from '../types/index.js';

export class PriceService {
  private coingeckoBaseUrl = 'https://api.coingecko.com/api/v3';
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private cacheDuration = 60000; // 1 minute cache

  // Token address to CoinGecko ID mapping for BSC
  private tokenIdMap: Record<string, string> = {
    '0x55d398326f99059fF775485246999027B3197955': 'tether', // USDT
    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d': 'usd-coin', // USDC
    '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c': 'wbnb', // WBNB
    '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c': 'bitcoin-bep2', // BTCB
    '0x2170Ed0880ac9A755fd29B2688956BD959F933F8': 'ethereum', // ETH
  };

  /**
   * Get current price for a token
   */
  async getCurrentPrice(tokenAddress: string): Promise<number> {
    const cacheKey = `${tokenAddress}-current`;
    const cached = this.priceCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.price;
    }

    try {
      const coingeckoId = this.tokenIdMap[tokenAddress.toLowerCase()];

      if (!coingeckoId) {
        console.warn(`No CoinGecko ID found for token ${tokenAddress}, defaulting to $1`);
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
      console.error(`Error fetching current price for ${tokenAddress}:`, error);
      return 0;
    }
  }

  /**
   * Get historical price for a token at a specific timestamp
   */
  async getHistoricalPrice(tokenAddress: string, timestamp: number): Promise<number> {
    try {
      const coingeckoId = this.tokenIdMap[tokenAddress.toLowerCase()];

      if (!coingeckoId) {
        console.warn(`No CoinGecko ID found for token ${tokenAddress}, defaulting to $1`);
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
        return this.getCurrentPrice(tokenAddress);
      }
      console.error(`Error fetching historical price for ${tokenAddress}:`, error);
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
