import { PnLCard } from '../types/index.js';
import { BscScanService } from './bscscan.service.js';
import { AaveParserService } from './aave-parser.service.js';
import { PriceService } from './price.service.js';
import { PnLCalculatorService } from './pnl-calculator.service.js';
import { ImageGeneratorService } from './image-generator.service.js';

export class AavePnLService {
  private bscScanService: BscScanService;
  private aaveParser: AaveParserService;
  private priceService: PriceService;
  private pnlCalculator: PnLCalculatorService;
  private imageGenerator: ImageGeneratorService;

  constructor(bscScanApiKey?: string) {
    this.bscScanService = new BscScanService(bscScanApiKey);
    this.aaveParser = new AaveParserService();
    this.priceService = new PriceService();
    this.pnlCalculator = new PnLCalculatorService(this.priceService);
    this.imageGenerator = new ImageGeneratorService();
  }

  /**
   * Generate PNL report for a wallet address
   */
  async generatePnLReport(walletAddress: string, outputPath?: string): Promise<PnLCard> {
    console.log(`\n🔍 Fetching transactions for wallet: ${walletAddress}...`);

    // Step 1: Fetch all transactions
    const allTransactions = await this.bscScanService.getTransactions(walletAddress);
    console.log(`✅ Found ${allTransactions.length} total transactions`);

    // Step 2: Filter Aave transactions
    const aaveTransactions = this.aaveParser.filterAaveTransactions(allTransactions);
    console.log(`✅ Found ${aaveTransactions.length} Aave transactions`);

    if (aaveTransactions.length === 0) {
      throw new Error('No Aave transactions found for this wallet');
    }

    // Step 3: Parse Aave events
    const aaveEvents = this.aaveParser.parseAaveTransactions(aaveTransactions);
    console.log(`✅ Parsed ${aaveEvents.length} Aave events`);

    if (aaveEvents.length === 0) {
      throw new Error('Could not parse any Aave events from transactions');
    }

    // Step 4: Aggregate positions
    const { supplied, borrowed } = this.aaveParser.aggregatePositions(aaveEvents);
    console.log(
      `✅ Aggregated positions: ${supplied.size} supplied, ${borrowed.size} borrowed`
    );

    // Step 5: Calculate PNL
    console.log(`\n📊 Calculating PNL...`);
    const position = await this.pnlCalculator.calculatePnL(aaveEvents, supplied, borrowed);

    console.log(`\n💰 PNL Summary:`);
    console.log(`   Initial Net Worth: $${position.initialNetWorth.toFixed(2)}`);
    console.log(`   Current Net Worth: $${position.currentNetWorth.toFixed(2)}`);
    console.log(`   Total PNL: $${position.totalPnL.toFixed(2)}`);
    console.log(`   PNL %: ${position.pnlPercentage.toFixed(2)}%`);

    // Step 6: Create PNL card data
    const pnlCard: PnLCard = {
      walletAddress,
      position,
      timestamp: Date.now(),
    };

    // Step 7: Generate image if output path provided
    if (outputPath) {
      console.log(`\n🎨 Generating PNL card image...`);
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
    let output = '\n📋 Detailed Position Breakdown:\n';
    output += '='.repeat(50) + '\n\n';

    // Supplied assets
    if (position.supplied.length > 0) {
      output += '💎 SUPPLIED ASSETS:\n';
      position.supplied.forEach(pos => {
        output += `   ${pos.symbol}:\n`;
        output += `      Amount: ${pos.amount.toFixed(6)}\n`;
        output += `      Initial Price: $${pos.initialPrice.toFixed(2)}\n`;
        output += `      Current Price: $${pos.currentPrice.toFixed(2)}\n`;
        output += `      Initial Value: $${pos.initialValue.toFixed(2)}\n`;
        output += `      Current Value: $${pos.currentValue.toFixed(2)}\n`;
        output += `      P&L: $${(pos.currentValue - pos.initialValue).toFixed(2)}\n\n`;
      });
    }

    // Borrowed assets
    if (position.borrowed.length > 0) {
      output += '🔴 BORROWED ASSETS:\n';
      position.borrowed.forEach(pos => {
        output += `   ${pos.symbol}:\n`;
        output += `      Amount: ${pos.amount.toFixed(6)}\n`;
        output += `      Initial Price: $${pos.initialPrice.toFixed(2)}\n`;
        output += `      Current Price: $${pos.currentPrice.toFixed(2)}\n`;
        output += `      Initial Value: $${pos.initialValue.toFixed(2)}\n`;
        output += `      Current Value: $${pos.currentValue.toFixed(2)}\n`;
        output += `      P&L: $${(pos.initialValue - pos.currentValue).toFixed(2)}\n\n`;
      });
    }

    return output;
  }
}
