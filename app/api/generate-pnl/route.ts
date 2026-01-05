import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AavePnLService } from '@/lib/services/aave-pnl.service';
import { writeFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
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

    console.log(`Generating PNL report for wallet: ${walletAddress}`);

    // Initialize PNL service
    const aavePnLService = new AavePnLService(process.env.BSCSCAN_API_KEY);

    // Generate output path
    const outputDir = join(process.cwd(), 'public', 'pnl-cards');
    const outputFileName = `${user.id}-${Date.now()}.png`;
    const outputPath = join(outputDir, outputFileName);

    // Ensure output directory exists
    const fs = require('fs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate PNL report
    const pnlCard = await aavePnLService.generatePnLReport(
      walletAddress,
      outputPath
    );

    // Save to database
    const imageUrl = `/pnl-cards/${outputFileName}`;

    const { data: reportData, error: insertError } = await supabase
      .from('pnl_reports')
      .insert({
        user_id: user.id,
        wallet_address: walletAddress,
        initial_networth: pnlCard.position.initialNetWorth,
        current_networth: pnlCard.position.currentNetWorth,
        total_pnl: pnlCard.position.totalPnL,
        pnl_percentage: pnlCard.position.pnlPercentage,
        report_data: pnlCard,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving report to database:', insertError);
      return NextResponse.json(
        { error: 'Failed to save report' },
        { status: 500 }
      );
    }

    // Save positions
    const positionsToInsert = [
      ...pnlCard.position.supplied.map(pos => ({
        report_id: reportData.id,
        position_type: 'supplied',
        token_symbol: pos.symbol,
        token_address: pos.address,
        amount: pos.amount,
        initial_price: pos.initialPrice,
        current_price: pos.currentPrice,
        initial_value: pos.initialValue,
        current_value: pos.currentValue,
      })),
      ...pnlCard.position.borrowed.map(pos => ({
        report_id: reportData.id,
        position_type: 'borrowed',
        token_symbol: pos.symbol,
        token_address: pos.address,
        amount: pos.amount,
        initial_price: pos.initialPrice,
        current_price: pos.currentPrice,
        initial_value: pos.initialValue,
        current_value: pos.currentValue,
      })),
    ];

    if (positionsToInsert.length > 0) {
      await supabase.from('positions').insert(positionsToInsert);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      report: {
        id: reportData.id,
        imageUrl,
        pnl: {
          initialNetWorth: pnlCard.position.initialNetWorth,
          currentNetWorth: pnlCard.position.currentNetWorth,
          totalPnL: pnlCard.position.totalPnL,
          pnlPercentage: pnlCard.position.pnlPercentage,
        },
        positions: {
          supplied: pnlCard.position.supplied,
          borrowed: pnlCard.position.borrowed,
        },
      },
    });
  } catch (error: any) {
    console.error('Error in generate-pnl API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
