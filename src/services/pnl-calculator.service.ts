import { AaveEvent, AavePosition, TokenPosition } from '../types/index.js';
import { PriceService } from './price.service.js';
import { AAVE_TOKENS } from '../config/aave.js';

export class PnLCalculatorService {
  private priceService: PriceService;

  constructor(priceService: PriceService) {
    this.priceService = priceService;
  }

  /**
   * Calculate PNL for Aave positions
   */
  async calculatePnL(
    events: AaveEvent[],
    suppliedPositions: Map<string, number>,
    borrowedPositions: Map<string, number>
  ): Promise<AavePosition> {
    const supplied: TokenPosition[] = [];
    const borrowed: TokenPosition[] = [];

    // Process supplied positions
    for (const [symbol, currentAmount] of suppliedPositions.entries()) {
      const tokenAddress = this.getTokenAddress(symbol);
      if (!tokenAddress) continue;

      const firstSupplyEvent = this.getFirstEventForToken(events, tokenAddress, ['supply']);
      const initialPrice = firstSupplyEvent
        ? await this.priceService.getHistoricalPrice(tokenAddress, firstSupplyEvent.timestamp)
        : 0;

      const currentPrice = await this.priceService.getCurrentPrice(tokenAddress);

      // Calculate the initial amount from first supply
      const initialAmount = this.calculateInitialAmount(events, tokenAddress, 'supply');

      supplied.push({
        symbol,
        address: tokenAddress,
        amount: currentAmount,
        initialPrice,
        currentPrice,
        initialValue: initialAmount * initialPrice,
        currentValue: currentAmount * currentPrice,
      });
    }

    // Process borrowed positions
    for (const [symbol, currentAmount] of borrowedPositions.entries()) {
      const tokenAddress = this.getTokenAddress(symbol);
      if (!tokenAddress) continue;

      const firstBorrowEvent = this.getFirstEventForToken(events, tokenAddress, ['borrow']);
      const initialPrice = firstBorrowEvent
        ? await this.priceService.getHistoricalPrice(tokenAddress, firstBorrowEvent.timestamp)
        : 0;

      const currentPrice = await this.priceService.getCurrentPrice(tokenAddress);

      const initialAmount = this.calculateInitialAmount(events, tokenAddress, 'borrow');

      borrowed.push({
        symbol,
        address: tokenAddress,
        amount: currentAmount,
        initialPrice,
        currentPrice,
        initialValue: initialAmount * initialPrice,
        currentValue: currentAmount * currentPrice,
      });
    }

    // Calculate net worth
    const totalSuppliedInitial = supplied.reduce((sum, pos) => sum + pos.initialValue, 0);
    const totalBorrowedInitial = borrowed.reduce((sum, pos) => sum + pos.initialValue, 0);
    const initialNetWorth = totalSuppliedInitial - totalBorrowedInitial;

    const totalSuppliedCurrent = supplied.reduce((sum, pos) => sum + pos.currentValue, 0);
    const totalBorrowedCurrent = borrowed.reduce((sum, pos) => sum + pos.currentValue, 0);
    const currentNetWorth = totalSuppliedCurrent - totalBorrowedCurrent;

    const totalPnL = currentNetWorth - initialNetWorth;
    const pnlPercentage = initialNetWorth !== 0 ? (totalPnL / initialNetWorth) * 100 : 0;

    return {
      supplied,
      borrowed,
      initialNetWorth,
      currentNetWorth,
      totalPnL,
      pnlPercentage,
    };
  }

  /**
   * Get token address from symbol
   */
  private getTokenAddress(symbol: string): string | null {
    const tokenInfo = AAVE_TOKENS[symbol as keyof typeof AAVE_TOKENS];
    return tokenInfo?.address || null;
  }

  /**
   * Get the first event for a specific token
   */
  private getFirstEventForToken(
    events: AaveEvent[],
    tokenAddress: string,
    eventTypes: string[]
  ): AaveEvent | null {
    const filteredEvents = events.filter(
      event =>
        event.token.toLowerCase() === tokenAddress.toLowerCase() &&
        eventTypes.includes(event.type)
    );

    if (filteredEvents.length === 0) return null;

    return filteredEvents.sort((a, b) => a.timestamp - b.timestamp)[0];
  }

  /**
   * Calculate initial amount based on first transaction
   */
  private calculateInitialAmount(
    events: AaveEvent[],
    tokenAddress: string,
    type: 'supply' | 'borrow'
  ): number {
    const relevantTypes = type === 'supply' ? ['supply', 'withdraw'] : ['borrow', 'repay'];
    const firstEvent = this.getFirstEventForToken(events, tokenAddress, relevantTypes);

    if (!firstEvent) return 0;

    // Get all events up to and including the first event
    let runningAmount = 0;
    const sortedEvents = events
      .filter(
        event =>
          event.token.toLowerCase() === tokenAddress.toLowerCase() &&
          relevantTypes.includes(event.type)
      )
      .sort((a, b) => a.timestamp - b.timestamp);

    if (sortedEvents.length === 0) return 0;

    // Use the amount from the first event as initial amount
    return sortedEvents[0].amount;
  }
}
