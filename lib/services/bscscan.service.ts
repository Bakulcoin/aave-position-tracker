import axios from 'axios';
import { AaveTransaction } from '../types/index.js';

export class BscScanService {
  private apiKey: string;
  private baseUrl = 'https://api.bscscan.com/api';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.BSCSCAN_API_KEY || '';
  }

  /**
   * Fetch all transactions for a wallet address
   */
  async getTransactions(address: string, startBlock = 0): Promise<AaveTransaction[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          module: 'account',
          action: 'txlist',
          address: address,
          startblock: startBlock,
          endblock: 99999999,
          sort: 'asc',
          apikey: this.apiKey,
        },
      });

      if (response.data.status === '1') {
        return response.data.result;
      } else {
        console.warn('BscScan API returned status 0:', response.data.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching transactions from BscScan:', error);
      throw error;
    }
  }

  /**
   * Fetch internal transactions (for tracking token transfers)
   */
  async getInternalTransactions(address: string): Promise<any[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          module: 'account',
          action: 'txlistinternal',
          address: address,
          startblock: 0,
          endblock: 99999999,
          sort: 'asc',
          apikey: this.apiKey,
        },
      });

      if (response.data.status === '1') {
        return response.data.result;
      }
      return [];
    } catch (error) {
      console.error('Error fetching internal transactions:', error);
      return [];
    }
  }

  /**
   * Fetch ERC20 token transfer events
   */
  async getTokenTransfers(address: string, contractAddress?: string): Promise<any[]> {
    try {
      const params: any = {
        module: 'account',
        action: 'tokentx',
        address: address,
        startblock: 0,
        endblock: 99999999,
        sort: 'asc',
        apikey: this.apiKey,
      };

      if (contractAddress) {
        params.contractaddress = contractAddress;
      }

      const response = await axios.get(this.baseUrl, { params });

      if (response.data.status === '1') {
        return response.data.result;
      }
      return [];
    } catch (error) {
      console.error('Error fetching token transfers:', error);
      return [];
    }
  }

  /**
   * Get current block number
   */
  async getCurrentBlockNumber(): Promise<number> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          module: 'proxy',
          action: 'eth_blockNumber',
          apikey: this.apiKey,
        },
      });

      return parseInt(response.data.result, 16);
    } catch (error) {
      console.error('Error fetching current block number:', error);
      throw error;
    }
  }
}
