import { ethers } from 'ethers';
import { AaveTransaction, AaveEvent } from '../types';
import { AAVE_CONTRACTS, AAVE_METHOD_SIGNATURES, AAVE_TOKENS } from '../config/aave';

export class AaveParserService {
  /**
   * Filter transactions to only Aave-related ones
   */
  filterAaveTransactions(transactions: AaveTransaction[]): AaveTransaction[] {
    return transactions.filter(tx => {
      const toAddress = tx.to.toLowerCase();
      return (
        toAddress === AAVE_CONTRACTS.POOL.toLowerCase() ||
        toAddress === AAVE_CONTRACTS.POOL_DATA_PROVIDER.toLowerCase()
      );
    });
  }

  /**
   * Parse Aave transactions into events
   */
  parseAaveTransactions(transactions: AaveTransaction[]): AaveEvent[] {
    const events: AaveEvent[] = [];

    for (const tx of transactions) {
      try {
        const event = this.parseTransaction(tx);
        if (event) {
          events.push(event);
        }
      } catch (error) {
        console.error(`Error parsing transaction ${tx.hash}:`, error);
      }
    }

    return events;
  }

  /**
   * Parse a single transaction into an AaveEvent
   */
  private parseTransaction(tx: AaveTransaction): AaveEvent | null {
    const methodId = tx.input.slice(0, 10).toLowerCase();

    let eventType: 'supply' | 'withdraw' | 'borrow' | 'repay' | null = null;

    if (methodId === AAVE_METHOD_SIGNATURES.SUPPLY.toLowerCase()) {
      eventType = 'supply';
    } else if (methodId === AAVE_METHOD_SIGNATURES.WITHDRAW.toLowerCase()) {
      eventType = 'withdraw';
    } else if (methodId === AAVE_METHOD_SIGNATURES.BORROW.toLowerCase()) {
      eventType = 'borrow';
    } else if (methodId === AAVE_METHOD_SIGNATURES.REPAY.toLowerCase()) {
      eventType = 'repay';
    }

    if (!eventType) {
      return null;
    }

    try {
      // Decode the transaction input
      const decoded = this.decodeTransactionInput(tx.input, eventType);

      if (!decoded) {
        return null;
      }

      return {
        type: eventType,
        token: decoded.tokenAddress,
        amount: decoded.amount,
        timestamp: parseInt(tx.timeStamp),
        txHash: tx.hash,
        blockNumber: parseInt(tx.blockNumber),
      };
    } catch (error) {
      console.error(`Failed to decode transaction ${tx.hash}:`, error);
      return null;
    }
  }

  /**
   * Decode transaction input data
   */
  private decodeTransactionInput(
    input: string,
    eventType: string
  ): { tokenAddress: string; amount: number } | null {
    try {
      // Remove '0x' and method signature (first 10 chars)
      const params = input.slice(10);

      // Parse parameters (each parameter is 64 hex chars = 32 bytes)
      // supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)
      // withdraw(address asset, uint256 amount, address to)
      // borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)
      // repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf)

      const tokenAddress = '0x' + params.slice(24, 64); // First parameter is asset address
      const amountHex = '0x' + params.slice(64, 128); // Second parameter is amount

      const amount = parseFloat(ethers.formatEther(BigInt(amountHex)));

      return {
        tokenAddress: ethers.getAddress(tokenAddress),
        amount,
      };
    } catch (error) {
      console.error('Error decoding input:', error);
      return null;
    }
  }

  /**
   * Get token symbol from address
   */
  getTokenSymbol(address: string): string {
    const normalizedAddress = address.toLowerCase();

    for (const [symbol, tokenInfo] of Object.entries(AAVE_TOKENS)) {
      if (tokenInfo.address.toLowerCase() === normalizedAddress) {
        return tokenInfo.symbol;
      }
    }

    return 'UNKNOWN';
  }

  /**
   * Aggregate events into net positions
   */
  aggregatePositions(events: AaveEvent[]): {
    supplied: Map<string, number>;
    borrowed: Map<string, number>;
  } {
    const supplied = new Map<string, number>();
    const borrowed = new Map<string, number>();

    for (const event of events) {
      const symbol = this.getTokenSymbol(event.token);

      switch (event.type) {
        case 'supply':
          supplied.set(symbol, (supplied.get(symbol) || 0) + event.amount);
          break;
        case 'withdraw':
          supplied.set(symbol, (supplied.get(symbol) || 0) - event.amount);
          break;
        case 'borrow':
          borrowed.set(symbol, (borrowed.get(symbol) || 0) + event.amount);
          break;
        case 'repay':
          borrowed.set(symbol, (borrowed.get(symbol) || 0) - event.amount);
          break;
      }
    }

    // Remove zero or negative positions
    for (const [symbol, amount] of supplied.entries()) {
      if (amount <= 0.0001) {
        supplied.delete(symbol);
      }
    }

    for (const [symbol, amount] of borrowed.entries()) {
      if (amount <= 0.0001) {
        borrowed.delete(symbol);
      }
    }

    return { supplied, borrowed };
  }
}
