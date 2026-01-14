import { NextRequest, NextResponse } from 'next/server';
import { discordService } from '@/lib/services/discord.service';

interface ShareRequest {
  walletAddress: string;
  currentNetWorth: number;
  totalPnL: number;
  pnlPercentage: number;
  suppliedTotal: number;
  borrowedTotal: number;
  imageBase64?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Discord is configured
    if (!discordService.isConfigured()) {
      return NextResponse.json(
        { error: 'Discord bot not configured. Set DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID environment variables.' },
        { status: 503 }
      );
    }

    const body: ShareRequest = await request.json();

    // Validate required fields
    if (!body.walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Convert base64 image to buffer if provided
    let imageBuffer: Buffer | undefined;
    if (body.imageBase64) {
      // Remove data URL prefix if present
      const base64Data = body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    }

    // Send to Discord
    const result = await discordService.sendPnLCard(
      {
        walletAddress: body.walletAddress,
        currentNetWorth: body.currentNetWorth || 0,
        totalPnL: body.totalPnL || 0,
        pnlPercentage: body.pnlPercentage || 0,
        suppliedTotal: body.suppliedTotal || 0,
        borrowedTotal: body.borrowedTotal || 0,
      },
      imageBuffer
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to share to Discord' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Shared to Discord successfully!' });
  } catch (error: any) {
    console.error('Share to Discord error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Check if Discord is configured
  const configured = discordService.isConfigured();
  return NextResponse.json({ configured });
}
