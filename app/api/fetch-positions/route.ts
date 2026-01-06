import { NextRequest, NextResponse } from 'next/server';
import { AavePnLService } from '@/lib/services/aave-pnl.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    console.log(`Fetching Aave positions for wallet: ${walletAddress}`);

    // Initialize PNL service
    const aavePnLService = new AavePnLService(process.env.BSCSCAN_API_KEY);

    // Generate PNL report (without saving to file)
    const pnlCard = await aavePnLService.generatePnLReport(walletAddress);

    // Return position data
    return NextResponse.json({
      success: true,
      walletAddress,
      positions: {
        supplied: pnlCard.position.supplied,
        borrowed: pnlCard.position.borrowed,
      },
      summary: {
        initialNetWorth: pnlCard.position.initialNetWorth,
        currentNetWorth: pnlCard.position.currentNetWorth,
        totalPnL: pnlCard.position.totalPnL,
        pnlPercentage: pnlCard.position.pnlPercentage,
      },
    });
  } catch (error: any) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}
