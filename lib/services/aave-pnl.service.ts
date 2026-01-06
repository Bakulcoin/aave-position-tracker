import { PnLCard, AavePosition, TokenPosition } from '../types';
import { BscScanService } from './bscscan.service';
import { PriceService } from './price.service';
import { ImageGeneratorService } from './image-generator.service';
import { AAVE_TOKENS } from '../config/aave';
import { ethers } from 'ethers';

interface TokenBalance {
  symbol: string;
  balance: number;
  decimals: number;
}

export class AavePnLService {
  private bscScanService: BscScanService;
  private priceService: PriceService;
  private imageGenerator: ImageGeneratorService;

  constructor(bscScanApiKey?: string) {
    this.bscScanService = new BscScanService(bscScanApiKey);
    this.priceService = new PriceService();
    this.imageGenerator = new ImageGeneratorService();
  }

  /**
   * Helper to add delay between API calls to avoid rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Scan wallet for aToken balances (supplied assets)
   */
  async fetchATokenBalances(walletAddress: string): Promise<Map<string, TokenBalance>> {
    const balances = new Map<string, TokenBalance>();

    console.log(`\n🔍 Scanning aToken (supplied) balances...`);

    for (const [key, tokenInfo] of Object.entries(AAVE_TOKENS)) {
      try {
        const rawBalance = await this.bscScanService.getTokenBalance(walletAddress, tokenInfo.aToken);

        if (rawBalance && rawBalance !== '0') {
          const balance = parseFloat(ethers.formatUnits(rawBalance, tokenInfo.decimals));

          if (balance > 0.0001) {
            console.log(`   ✅ ${tokenInfo.symbol}: ${balance.toFixed(6)}`);

            balances.set(tokenInfo.symbol, {
              symbol: tokenInfo.symbol,
              balance,
              decimals: tokenInfo.decimals,
            });
          }
        }
      } catch (error) {
        console.error(`   ❌ Error fetching ${tokenInfo.symbol}:`, error);
      }

      // Small delay to avoid rate limiting on public RPC
      await this.sleep(100);
    }

    return balances;
  }

  /**
   * Scan wallet for debtToken balances (borrowed assets)
   */
  async fetchDebtTokenBalances(walletAddress: string): Promise<Map<string, TokenBalance>> {
    const balances = new Map<string, TokenBalance>();

    console.log(`\n🔍 Scanning debtToken (borrowed) balances...`);

    for (const [key, tokenInfo] of Object.entries(AAVE_TOKENS)) {
      try {
        const rawBalance = await this.bscScanService.getTokenBalance(walletAddress, tokenInfo.debtToken);

        if (rawBalance && rawBalance !== '0') {
          const balance = parseFloat(ethers.formatUnits(rawBalance, tokenInfo.decimals));

          if (balance > 0.0001) {
            console.log(`   ⚠️ ${tokenInfo.symbol}: ${balance.toFixed(6)} borrowed`);

            balances.set(tokenInfo.symbol, {
              symbol: tokenInfo.symbol,
              balance,
              decimals: tokenInfo.decimals,
            });
          }
        }
      } catch (error) {
        console.error(`   ❌ Error fetching ${tokenInfo.symbol} debt:`, error);
      }

      // Small delay to avoid rate limiting on public RPC
      await this.sleep(100);
    }

    return balances;
  }

  /**
   * Generate portfolio report:
   * 1. Scan wallet for aToken balances (supplied)
   * 2. Scan wallet for debtToken balances (borrowed)
   * 3. Get current prices
   * 4. Calculate net worth (supplied - borrowed)
   * 5. Generate portfolio card
   */
  async generatePnLReport(walletAddress: string, outputPath?: string): Promise<PnLCard> {
    console.log(`\n🔍 Fetching Aave positions for wallet: ${walletAddress}`);

    // Scan wallet for balances
    const aTokenBalances = await this.fetchATokenBalances(walletAddress);
    const debtTokenBalances = await this.fetchDebtTokenBalances(walletAddress);

    if (aTokenBalances.size === 0 && debtTokenBalances.size === 0) {
      throw new Error('No Aave positions found for this wallet');
    }

    console.log(`\n✅ Found ${aTokenBalances.size} supplied, ${debtTokenBalances.size} borrowed positions`);

    // Get current prices and calculate values
    console.log(`\n📊 Fetching current prices...`);
    const suppliedPositions: TokenPosition[] = [];
    let totalSupplied = 0;

    for (const [symbol, tokenData] of aTokenBalances) {
      const tokenInfo = AAVE_TOKENS[symbol as keyof typeof AAVE_TOKENS];
      const currentPrice = await this.priceService.getCurrentPrice(symbol);
      const currentValue = tokenData.balance * currentPrice;

      totalSupplied += currentValue;

      suppliedPositions.push({
        symbol,
        address: tokenInfo?.address || '',
        amount: tokenData.balance,
        initialPrice: currentPrice,
        currentPrice,
        initialValue: currentValue,
        currentValue,
      });

      console.log(`   💰 ${symbol}: ${tokenData.balance.toFixed(6)} × $${currentPrice.toFixed(2)} = $${currentValue.toFixed(2)}`);
    }

    // Process borrowed positions
    const borrowedPositions: TokenPosition[] = [];
    let totalBorrowed = 0;

    for (const [symbol, tokenData] of debtTokenBalances) {
      const tokenInfo = AAVE_TOKENS[symbol as keyof typeof AAVE_TOKENS];
      const currentPrice = await this.priceService.getCurrentPrice(symbol);
      const currentValue = tokenData.balance * currentPrice;

      totalBorrowed += currentValue;

      borrowedPositions.push({
        symbol,
        address: tokenInfo?.address || '',
        amount: tokenData.balance,
        initialPrice: currentPrice,
        currentPrice,
        initialValue: currentValue,
        currentValue,
      });

      console.log(`   🔴 ${symbol}: ${tokenData.balance.toFixed(6)} × $${currentPrice.toFixed(2)} = $${currentValue.toFixed(2)}`);
    }

    // Calculate net worth
    const netWorth = totalSupplied - totalBorrowed;

    const position: AavePosition = {
      supplied: suppliedPositions,
      borrowed: borrowedPositions,
      initialNetWorth: netWorth,
      currentNetWorth: netWorth,
      totalPnL: 0,
      pnlPercentage: 0,
    };

    console.log(`\n💰 Portfolio Summary:`);
    console.log(`   Total Supplied: $${totalSupplied.toFixed(2)}`);
    console.log(`   Total Borrowed: $${totalBorrowed.toFixed(2)}`);
    console.log(`   ─────────────────────────`);
    console.log(`   Net Worth: $${netWorth.toFixed(2)}`);

    const pnlCard: PnLCard = {
      walletAddress,
      position,
      timestamp: Date.now(),
    };

    if (outputPath) {
      console.log(`\n🎨 Generating portfolio card image...`);
      await this.imageGenerator.generatePnLCard(pnlCard, outputPath);
      console.log(`✅ Image saved to: ${outputPath}`);
    }

    return pnlCard;
  }

  /**
   * Get detailed position breakdown
   */
  getPositionBreakdown(pnlCard: PnLCard): string {
    const { position } = pnlCard;
    let output = '\n📋 Portfolio Breakdown:\n';
    output += '='.repeat(50) + '\n\n';

    let totalSupplied = 0;
    let totalBorrowed = 0;

    if (position.supplied.length > 0) {
      output += '💎 SUPPLIED ASSETS:\n';
      position.supplied.forEach(pos => {
        output += `   ${pos.symbol}:\n`;
        output += `      Amount: ${pos.amount.toFixed(6)}\n`;
        output += `      Price: $${pos.currentPrice.toFixed(2)}\n`;
        output += `      Value: $${pos.currentValue.toFixed(2)}\n\n`;
        totalSupplied += pos.currentValue;
      });
    }

    if (position.borrowed.length > 0) {
      output += '🔴 BORROWED ASSETS:\n';
      position.borrowed.forEach(pos => {
        output += `   ${pos.symbol}:\n`;
        output += `      Amount: ${pos.amount.toFixed(6)}\n`;
        output += `      Price: $${pos.currentPrice.toFixed(2)}\n`;
        output += `      Value: $${pos.currentValue.toFixed(2)}\n\n`;
        totalBorrowed += pos.currentValue;
      });
    }

    output += '='.repeat(50) + '\n';
    output += `💰 TOTAL SUPPLIED: $${totalSupplied.toFixed(2)}\n`;
    output += `🔴 TOTAL BORROWED: $${totalBorrowed.toFixed(2)}\n`;
    output += `📊 NET WORTH: $${(totalSupplied - totalBorrowed).toFixed(2)}\n`;

    return output;
  }
}
