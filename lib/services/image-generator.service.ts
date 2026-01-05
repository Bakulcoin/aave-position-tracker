import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import { writeFileSync } from 'fs';
import { AavePosition, PnLCard } from '../types/index.js';

export class ImageGeneratorService {
  private width = 900;
  private height = 600;
  private backgroundColor = '#1a1a1a';
  private primaryColor = '#00d4aa';
  private textColor = '#ffffff';
  private secondaryTextColor = '#a0a0a0';

  /**
   * Generate PNL card image
   */
  async generatePnLCard(pnlData: PnLCard, outputPath: string): Promise<string> {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    // Draw background
    this.drawBackground(ctx);

    // Draw header
    this.drawHeader(ctx);

    // Draw wallet address
    this.drawWalletAddress(ctx, pnlData.walletAddress);

    // Draw positions summary
    this.drawPositionsSummary(ctx, pnlData.position);

    // Draw PNL metrics
    this.drawPnLMetrics(ctx, pnlData.position);

    // Draw detailed positions
    this.drawDetailedPositions(ctx, pnlData.position);

    // Save to file
    const buffer = canvas.toBuffer('image/png');
    writeFileSync(outputPath, buffer);

    return outputPath;
  }

  /**
   * Draw background
   */
  private drawBackground(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.width, this.height);

    // Add subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, 'rgba(0, 212, 170, 0.05)');
    gradient.addColorStop(1, 'rgba(0, 212, 170, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Draw header with title
   */
  private drawHeader(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.primaryColor;
    ctx.font = 'bold 42px Arial';
    ctx.fillText('Aave PNL Report', 50, 70);

    ctx.fillStyle = this.secondaryTextColor;
    ctx.font = '18px Arial';
    const date = new Date().toLocaleDateString();
    ctx.fillText(`Generated: ${date}`, 50, 100);
  }

  /**
   * Draw wallet address
   */
  private drawWalletAddress(ctx: CanvasRenderingContext2D, address: string): void {
    ctx.fillStyle = this.secondaryTextColor;
    ctx.font = '16px monospace';
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    ctx.fillText(`Wallet: ${shortAddress}`, 50, 130);
  }

  /**
   * Draw positions summary
   */
  private drawPositionsSummary(ctx: CanvasRenderingContext2D, position: AavePosition): void {
    const yStart = 170;

    // Box background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(40, yStart - 20, this.width - 80, 120);

    ctx.fillStyle = this.secondaryTextColor;
    ctx.font = '20px Arial';
    ctx.fillText('Portfolio Summary', 60, yStart);

    // Initial Net Worth
    ctx.fillStyle = this.textColor;
    ctx.font = '16px Arial';
    ctx.fillText('Initial Net Worth:', 60, yStart + 40);
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`$${position.initialNetWorth.toFixed(2)}`, 280, yStart + 40);

    // Current Net Worth
    ctx.fillStyle = this.textColor;
    ctx.font = '16px Arial';
    ctx.fillText('Current Net Worth:', 60, yStart + 80);
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`$${position.currentNetWorth.toFixed(2)}`, 280, yStart + 80);
  }

  /**
   * Draw PNL metrics (main highlight)
   */
  private drawPnLMetrics(ctx: CanvasRenderingContext2D, position: AavePosition): void {
    const yStart = 330;
    const isProfit = position.totalPnL >= 0;

    // Large PNL box
    ctx.fillStyle = isProfit ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 82, 82, 0.1)';
    ctx.fillRect(40, yStart - 20, this.width - 80, 140);

    // PNL Label
    ctx.fillStyle = this.secondaryTextColor;
    ctx.font = '22px Arial';
    ctx.fillText('TOTAL PNL', 60, yStart + 10);

    // PNL Amount
    ctx.fillStyle = isProfit ? '#00ff88' : '#ff5252';
    ctx.font = 'bold 48px Arial';
    const pnlSign = isProfit ? '+' : '';
    ctx.fillText(`${pnlSign}$${position.totalPnL.toFixed(2)}`, 60, yStart + 65);

    // PNL Percentage
    ctx.font = 'bold 36px Arial';
    ctx.fillText(`${pnlSign}${position.pnlPercentage.toFixed(2)}%`, 60, yStart + 110);
  }

  /**
   * Draw detailed positions
   */
  private drawDetailedPositions(ctx: CanvasRenderingContext2D, position: AavePosition): void {
    const yStart = 500;

    ctx.fillStyle = this.secondaryTextColor;
    ctx.font = '18px Arial';
    ctx.fillText('Positions:', 60, yStart);

    let xOffset = 200;

    // Supplied assets
    if (position.supplied.length > 0) {
      ctx.fillStyle = this.textColor;
      ctx.font = '16px Arial';
      const suppliedText = position.supplied
        .map(pos => `${pos.symbol}: ${pos.amount.toFixed(4)}`)
        .join(', ');
      ctx.fillText(`Supplied: ${suppliedText}`, xOffset, yStart);
    }

    // Borrowed assets
    if (position.borrowed.length > 0) {
      ctx.fillStyle = this.textColor;
      ctx.font = '16px Arial';
      const borrowedText = position.borrowed
        .map(pos => `${pos.symbol}: ${pos.amount.toFixed(4)}`)
        .join(', ');
      ctx.fillText(`Borrowed: ${borrowedText}`, xOffset, yStart + 30);
    }
  }
}
