import { NextRequest, NextResponse } from 'next/server';
import { AavePnLService } from '@/lib/services/aave-pnl.service';
import { CHAIN_IDS, ChainId } from '@/lib/config/aave';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, chainId: requestedChainId } = body;

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

    // Validate and set chain ID (default to BSC for backwards compatibility)
    const chainId: ChainId = requestedChainId === CHAIN_IDS.BASE
      ? CHAIN_IDS.BASE
      : CHAIN_IDS.BSC;

    console.log(`Fetching Aave positions for wallet: ${walletAddress} on chain ${chainId}`);

    // Initialize PNL service with chain ID
    const aavePnLService = new AavePnLService(process.env.BSCSCAN_API_KEY, chainId);

    // Generate PNL report (without saving to file)
    const pnlCard = await aavePnLService.generatePnLReport(walletAddress);

    // Return position data
    return NextResponse.json({
      success: true,
      walletAddress,
      chainId,
      chainName: aavePnLService.getChainName(),
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
