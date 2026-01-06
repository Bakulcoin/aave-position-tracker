import { ethers } from 'ethers';
import { AaveTransaction } from '../types';

export interface TokenBalance {
  tokenAddress: string;
  tokenSymbol: string;
  balance: string;
  decimals: number;
}

// ERC20 ABI for balanceOf function
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

export class BscScanService {
  private provider: ethers.JsonRpcProvider;
  private bscTraceUrl = 'https://bsc-mainnet.nodereal.io/v1';
  private nodeRealApiKey: string;

  constructor(apiKey?: string) {
    // Use public BSC RPC endpoint (free, no API key required)
    // Alternative endpoints:
    // - https://bsc-dataseed.binance.org
    // - https://bsc-dataseed1.defibit.io
    // - https://bsc-dataseed1.ninicoin.io
    this.provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org');
    this.nodeRealApiKey = apiKey || process.env.BSCSCAN_API_KEY || '';
  }

  /**
   * Get token balance for a specific contract address using direct RPC call
   */
  async getTokenBalance(walletAddress: string, contractAddress: string): Promise<string> {
    try {
      const contract = new ethers.Contract(contractAddress, ERC20_ABI, this.provider);
      const balance = await contract.balanceOf(walletAddress);
      return balance.toString();
    } catch (error) {
      console.error(`Error fetching token balance for ${contractAddress}:`, error);
      return '0';
    }
  }

  /**
   * Fetch all transactions for a wallet address
   * Note: This requires an indexer service, using NodeReal/BSCTrace API
   */
  async getTransactions(address: string, startBlock = 0): Promise<AaveTransaction[]> {
    try {
      // Use NodeReal's BSCTrace API (free tier available)
      const response = await fetch(`${this.bscTraceUrl}/${this.nodeRealApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getTransactionsByAddress',
          params: [address, startBlock, 'latest', 'asc', 1000],
        }),
      });

      const data = await response.json();
      if (data.result) {
        return data.result;
      }
      console.warn('BSCTrace API returned no transactions:', data);
      return [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  /**
   * Fetch internal transactions (for tracking token transfers)
   */
  async getInternalTransactions(address: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.bscTraceUrl}/${this.nodeRealApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'trace_filter',
          params: [{
            fromBlock: 'earliest',
            toBlock: 'latest',
            toAddress: [address],
          }],
        }),
      });

      const data = await response.json();
      return data.result || [];
    } catch (error) {
      console.error('Error fetching internal transactions:', error);
      return [];
    }
  }

  /**
   * Fetch ERC20 token transfer events using getLogs RPC call
   * Transfer event signature: Transfer(address indexed from, address indexed to, uint256 value)
   *
   * Note: Public BSC RPC has rate limits, so we query in smaller block ranges
   */
  async getTokenTransfers(address: string, contractAddress?: string): Promise<any[]> {
    try {
      // Transfer event topic
      const transferTopic = ethers.id('Transfer(address,address,uint256)');

      // Pad address to 32 bytes for topics filter
      const paddedAddress = ethers.zeroPadValue(address.toLowerCase(), 32);

      // Get current block number
      const currentBlock = await this.provider.getBlockNumber();

      // Query last ~6 months of blocks (~10M blocks at 3s/block)
      // This is more reasonable for public RPCs and covers most use cases
      const blocksToQuery = 10_000_000; // ~6 months
      const fromBlock = Math.max(0, currentBlock - blocksToQuery);

      // Build filter - get transfers TO this address
      const filter: any = {
        topics: [
          transferTopic,
          null, // from (any)
          paddedAddress, // to (this wallet)
        ],
        fromBlock: fromBlock,
        toBlock: 'latest',
      };

      if (contractAddress) {
        filter.address = contractAddress;
      }

      let logs: any[] = [];
      try {
        logs = await this.provider.getLogs(filter);
      } catch (rpcError: any) {
        // If rate limited, try a smaller range
        if (rpcError.code === 'BAD_DATA' || rpcError.message?.includes('rate limit')) {
          console.log('Rate limited, trying smaller block range...');
          filter.fromBlock = currentBlock - 1_000_000; // ~1 month
          try {
            logs = await this.provider.getLogs(filter);
          } catch (innerError) {
            console.warn('Still rate limited, returning empty results');
            return [];
          }
        } else {
          throw rpcError;
        }
      }

      // Parse logs into transfer format
      const transfers = logs.map((log) => {
        const from = ethers.getAddress('0x' + log.topics[1]?.slice(26));
        const to = ethers.getAddress('0x' + log.topics[2]?.slice(26));
        const value = BigInt(log.data).toString();

        return {
          blockNumber: log.blockNumber.toString(),
          timeStamp: '', // Will be filled in later if needed
          hash: log.transactionHash,
          from,
          to,
          value,
          contractAddress: log.address,
          tokenSymbol: '', // Will be filled if needed
          tokenDecimal: '18', // Default, can be fetched
        };
      });

      // Get block timestamps for the first transfer only (to find initial timestamp)
      if (transfers.length > 0) {
        const firstBlockNum = parseInt(transfers[0].blockNumber);
        try {
          const block = await this.provider.getBlock(firstBlockNum);
          if (block) {
            transfers[0].timeStamp = block.timestamp.toString();
          }
        } catch (error) {
          console.error(`Error fetching block ${firstBlockNum}:`, error);
        }
      }

      return transfers;
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
      const blockNumber = await this.provider.getBlockNumber();
      return blockNumber;
    } catch (error) {
      console.error('Error fetching current block number:', error);
      throw error;
    }
  }

  /**
   * Get block by number to retrieve timestamp
   */
  async getBlockTimestamp(blockNumber: number): Promise<number> {
    try {
      const block = await this.provider.getBlock(blockNumber);
      return block?.timestamp || Math.floor(Date.now() / 1000);
    } catch (error) {
      console.error('Error fetching block:', error);
      return Math.floor(Date.now() / 1000);
    }
  }
}
