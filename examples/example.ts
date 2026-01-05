import { AavePnLService } from '../src/services/aave-pnl.service.js';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Example: Generate PNL report programmatically
 */
async function exampleUsage() {
  // Initialize the service
  const aavePnLService = new AavePnLService(process.env.BSCSCAN_API_KEY);

  // Example wallet address (replace with actual address)
  const walletAddress = '0x1234567890123456789012345678901234567890';

  try {
    console.log('Generating PNL report...\n');

    // Generate the report
    const pnlCard = await aavePnLService.generatePnLReport(
      walletAddress,
      './output/example-pnl-card.png'
    );

    // Access the data programmatically
    console.log('\nProgrammatic Access to Data:');
    console.log('============================');
    console.log(`Wallet: ${pnlCard.walletAddress}`);
    console.log(`Timestamp: ${new Date(pnlCard.timestamp).toLocaleString()}`);
    console.log(`\nPosition Data:`);
    console.log(`  Initial Net Worth: $${pnlCard.position.initialNetWorth.toFixed(2)}`);
    console.log(`  Current Net Worth: $${pnlCard.position.currentNetWorth.toFixed(2)}`);
    console.log(`  Total PNL: $${pnlCard.position.totalPnL.toFixed(2)}`);
    console.log(`  PNL %: ${pnlCard.position.pnlPercentage.toFixed(2)}%`);

    // Access supplied positions
    console.log(`\nSupplied Positions:`);
    pnlCard.position.supplied.forEach(pos => {
      console.log(`  ${pos.symbol}: ${pos.amount} (Value: $${pos.currentValue.toFixed(2)})`);
    });

    // Access borrowed positions
    if (pnlCard.position.borrowed.length > 0) {
      console.log(`\nBorrowed Positions:`);
      pnlCard.position.borrowed.forEach(pos => {
        console.log(`  ${pos.symbol}: ${pos.amount} (Value: $${pos.currentValue.toFixed(2)})`);
      });
    }

    // Get detailed breakdown
    console.log(aavePnLService.getPositionBreakdown(pnlCard));
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// Run the example
exampleUsage();
