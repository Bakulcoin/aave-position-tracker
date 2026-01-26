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

    console.log(`Generating PNL card data for wallet: ${walletAddress}`);

    // Initialize PNL service
    const aavePnLService = new AavePnLService(process.env.BSCSCAN_API_KEY);

    // Generate PNL report (data only, image generation handled separately)
    const pnlCard = await aavePnLService.generatePnLReport(walletAddress);

    // Return data for client-side image generation
    return NextResponse.json({
      success: true,
      walletAddress,
      positions: {
        supplied: pnlCard.position.supplied,
        borrowed: pnlCard.position.borrowed,
      },
      summary: {
        totalSupplied: pnlCard.position.supplied.reduce((sum, p) => sum + p.currentValue, 0),
        totalBorrowed: pnlCard.position.borrowed.reduce((sum, p) => sum + p.currentValue, 0),
        netWorth: pnlCard.position.currentNetWorth,
      },
      timestamp: pnlCard.timestamp,
      message: 'PNL data generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating PNL card:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PNL card' },
      { status: 500 }
    );
  }
}
