import { NextRequest, NextResponse } from 'next/server';
import { AavePnLService } from '@/lib/services/aave-pnl.service';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

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

    console.log(`Generating PNL card for wallet: ${walletAddress}`);

    // Initialize PNL service
    const aavePnLService = new AavePnLService(process.env.BSCSCAN_API_KEY);

    // Generate output path
    const outputDir = join(process.cwd(), 'public', 'pnl-cards');
    const outputFileName = `${walletAddress.slice(0, 10)}-${Date.now()}.png`;
    const outputPath = join(outputDir, outputFileName);

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Generate PNL report with image
    const pnlCard = await aavePnLService.generatePnLReport(
      walletAddress,
      outputPath
    );

    const imageUrl = `/pnl-cards/${outputFileName}`;

    // Return success response
    return NextResponse.json({
      success: true,
      imageUrl,
      message: 'PNL card generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating PNL card:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PNL card' },
      { status: 500 }
    );
  }
}
