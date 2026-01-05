#!/usr/bin/env node
import { config } from 'dotenv';
import { AavePnLService } from './services/aave-pnl.service.js';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Load environment variables
config();

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
╔════════════════════════════════════════════════════╗
║         Aave PNL Generator for BSC                 ║
╚════════════════════════════════════════════════════╝

Usage: npm run generate <wallet_address> [options]

Arguments:
  wallet_address    Your BSC wallet address

Options:
  --output, -o      Output path for the PNL card image
                    (default: ./output/pnl-card.png)

Examples:
  npm run generate 0x1234...5678
  npm run generate 0x1234...5678 --output my-pnl.png

Environment Variables:
  BSCSCAN_API_KEY   Your BscScan API key (optional but recommended)
                    Get one at https://bscscan.com/apis
    `);
    process.exit(0);
  }

  const walletAddress = args[0];

  // Validate wallet address
  if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
    console.error('❌ Error: Invalid wallet address format');
    console.error('   Expected: 0x followed by 40 hexadecimal characters');
    process.exit(1);
  }

  // Parse output path
  let outputPath = join(process.cwd(), 'output', 'pnl-card.png');
  const outputIndex = args.findIndex(arg => arg === '--output' || arg === '-o');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    outputPath = args[outputIndex + 1];
  }

  // Ensure output directory exists
  const outputDir = join(process.cwd(), 'output');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  try {
    console.log('\n🚀 Starting Aave PNL Report Generation...\n');
    console.log(`Wallet: ${walletAddress}`);
    console.log(`Output: ${outputPath}\n`);

    // Check for API key
    if (!process.env.BSCSCAN_API_KEY) {
      console.warn('⚠️  Warning: BSCSCAN_API_KEY not found in environment variables');
      console.warn('   API calls may be rate-limited. Get a free key at https://bscscan.com/apis\n');
    }

    // Initialize service
    const aavePnLService = new AavePnLService(process.env.BSCSCAN_API_KEY);

    // Generate report
    const pnlCard = await aavePnLService.generatePnLReport(walletAddress, outputPath);

    // Print detailed breakdown
    console.log(aavePnLService.getPositionBreakdown(pnlCard));

    console.log('\n✅ PNL Report generated successfully!\n');
  } catch (error: any) {
    console.error('\n❌ Error generating PNL report:');
    console.error(`   ${error.message}\n`);

    if (error.message.includes('rate limit') || error.message.includes('429')) {
      console.error('💡 Tip: Add a BSCSCAN_API_KEY to your .env file to avoid rate limits\n');
    }

    process.exit(1);
  }
}

// Run the CLI
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
