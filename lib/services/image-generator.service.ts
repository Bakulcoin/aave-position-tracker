import { writeFileSync } from 'fs';
import { AavePosition, PnLCard } from '../types';

export class ImageGeneratorService {
  private width = 800;
  private height = 700;
  private backgroundColor = '#0d1117';
  private primaryColor = '#00d4aa';
  private textColor = '#ffffff';
  private secondaryTextColor = '#8b949e';
  private greenColor = '#3fb950';
  private redColor = '#f85149';

  /**
   * Generate portfolio card image showing supply/borrow positions
   */
  async generatePnLCard(pnlData: PnLCard, outputPath: string): Promise<string> {
    // Check if canvas is available (for CLI usage)
    let canvas;
    try {
      canvas = await import('canvas');
    } catch (err) {
      throw new Error(
        'Canvas package not installed. Image generation is only available in CLI mode. ' +
        'For web usage, use the browser-based card generation instead.'
      );
    }

    const canvasInstance = canvas.createCanvas(this.width, this.height);
    const ctx = canvasInstance.getContext('2d');

    // Draw background
    this.drawBackground(ctx);

    // Draw header
    this.drawHeader(ctx, pnlData.walletAddress);

    // Draw supplied positions
    let yOffset = this.drawSuppliedPositions(ctx, pnlData.position);

    // Draw borrowed positions
    yOffset = this.drawBorrowedPositions(ctx, pnlData.position, yOffset);

    // Draw net worth summary
    this.drawNetWorthSummary(ctx, pnlData.position, yOffset);

    // Save to file
    const buffer = canvasInstance.toBuffer('image/png');
    writeFileSync(outputPath, buffer);

    return outputPath;
  }

  private drawBackground(ctx: any): void {
    // Dark background
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, 'rgba(0, 212, 170, 0.03)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, this.width - 2, this.height - 2);
  }

  private drawHeader(ctx: any, address: string): void {
    // Aave logo placeholder
    ctx.fillStyle = this.primaryColor;
    ctx.beginPath();
    ctx.arc(50, 50, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.backgroundColor;
    ctx.font = 'bold 24px Arial';
    ctx.fillText('A', 40, 58);

    // Title
    ctx.fillStyle = this.textColor;
    ctx.font = 'bold 32px Arial';
    ctx.fillText('Aave V3 Portfolio', 90, 55);

    // Subtitle
    ctx.fillStyle = this.secondaryTextColor;
    ctx.font = '16px Arial';
    ctx.fillText('BSC', 90, 75);

    // Wallet address
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    ctx.fillStyle = this.secondaryTextColor;
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(shortAddress, this.width - 40, 55);
    ctx.textAlign = 'left';

    // Date
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    ctx.fillText(date, this.width - 40 - ctx.measureText(date).width, 75);

    // Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(40, 100);
    ctx.lineTo(this.width - 40, 100);
    ctx.stroke();
  }

  private drawSuppliedPositions(ctx: any, position: AavePosition): number {
    let yStart = 130;

    // Section header
    ctx.fillStyle = this.greenColor;
    ctx.font = 'bold 18px Arial';
    ctx.fillText('SUPPLIED', 40, yStart);

    // Calculate total supplied
    const totalSupplied = position.supplied.reduce((sum, p) => sum + p.currentValue, 0);
    ctx.fillStyle = this.textColor;
    ctx.textAlign = 'right';
    ctx.fillText(`$${totalSupplied.toFixed(2)}`, this.width - 40, yStart);
    ctx.textAlign = 'left';

    yStart += 30;

    // Table header
    ctx.fillStyle = this.secondaryTextColor;
    ctx.font = '12px Arial';
    ctx.fillText('Asset', 40, yStart);
    ctx.fillText('Amount', 300, yStart);
    ctx.textAlign = 'right';
    ctx.fillText('Value', this.width - 40, yStart);
    ctx.textAlign = 'left';

    yStart += 20;

    // Positions
    position.supplied.forEach((pos) => {
      // Asset circle
      ctx.fillStyle = this.primaryColor + '30';
      ctx.beginPath();
      ctx.arc(55, yStart + 5, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.textColor;
      ctx.font = 'bold 12px Arial';
      ctx.fillText(pos.symbol[0], 50, yStart + 10);

      // Asset name
      ctx.font = '16px Arial';
      ctx.fillText(pos.symbol, 80, yStart + 10);

      // Amount
      ctx.fillStyle = this.secondaryTextColor;
      ctx.font = '14px monospace';
      ctx.fillText(pos.amount.toFixed(6), 300, yStart + 10);

      // Value
      ctx.fillStyle = this.textColor;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`$${pos.currentValue.toFixed(2)}`, this.width - 40, yStart + 10);
      ctx.textAlign = 'left';

      yStart += 45;
    });

    if (position.supplied.length === 0) {
      ctx.fillStyle = this.secondaryTextColor;
      ctx.font = '14px Arial';
      ctx.fillText('No supplied assets', 40, yStart + 10);
      yStart += 45;
    }

    return yStart + 20;
  }

  private drawBorrowedPositions(ctx: any, position: AavePosition, yStart: number): number {
    // Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(40, yStart - 10);
    ctx.lineTo(this.width - 40, yStart - 10);
    ctx.stroke();

    // Section header
    ctx.fillStyle = this.redColor;
    ctx.font = 'bold 18px Arial';
    ctx.fillText('BORROWED', 40, yStart + 20);

    // Calculate total borrowed
    const totalBorrowed = position.borrowed.reduce((sum, p) => sum + p.currentValue, 0);
    ctx.fillStyle = this.textColor;
    ctx.textAlign = 'right';
    ctx.fillText(`$${totalBorrowed.toFixed(2)}`, this.width - 40, yStart + 20);
    ctx.textAlign = 'left';

    yStart += 50;

    // Table header
    ctx.fillStyle = this.secondaryTextColor;
    ctx.font = '12px Arial';
    ctx.fillText('Asset', 40, yStart);
    ctx.fillText('Amount', 300, yStart);
    ctx.textAlign = 'right';
    ctx.fillText('Value', this.width - 40, yStart);
    ctx.textAlign = 'left';

    yStart += 20;

    // Positions
    position.borrowed.forEach((pos) => {
      // Asset circle
      ctx.fillStyle = this.redColor + '30';
      ctx.beginPath();
      ctx.arc(55, yStart + 5, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.redColor;
      ctx.font = 'bold 12px Arial';
      ctx.fillText(pos.symbol[0], 50, yStart + 10);

      // Asset name
      ctx.fillStyle = this.textColor;
      ctx.font = '16px Arial';
      ctx.fillText(pos.symbol, 80, yStart + 10);

      // Amount
      ctx.fillStyle = this.secondaryTextColor;
      ctx.font = '14px monospace';
      ctx.fillText(pos.amount.toFixed(6), 300, yStart + 10);

      // Value
      ctx.fillStyle = this.redColor;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`$${pos.currentValue.toFixed(2)}`, this.width - 40, yStart + 10);
      ctx.textAlign = 'left';

      yStart += 45;
    });

    if (position.borrowed.length === 0) {
      ctx.fillStyle = this.secondaryTextColor;
      ctx.font = '14px Arial';
      ctx.fillText('No borrowed assets', 40, yStart + 10);
      yStart += 45;
    }

    return yStart + 20;
  }

  private drawNetWorthSummary(ctx: any, position: AavePosition, yStart: number): void {
    // Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(40, yStart - 10);
    ctx.lineTo(this.width - 40, yStart - 10);
    ctx.stroke();

    // Net worth box
    const boxY = yStart + 10;
    const boxHeight = 80;

    // Gradient background for net worth
    const gradient = ctx.createLinearGradient(40, boxY, this.width - 40, boxY);
    gradient.addColorStop(0, 'rgba(0, 212, 170, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 212, 170, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fillRect(40, boxY, this.width - 80, boxHeight);

    // Border
    ctx.strokeStyle = this.primaryColor + '50';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, boxY, this.width - 80, boxHeight);

    // Net Worth label
    ctx.fillStyle = this.secondaryTextColor;
    ctx.font = '16px Arial';
    ctx.fillText('NET WORTH', 60, boxY + 35);

    // Net Worth value
    ctx.fillStyle = this.primaryColor;
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`$${position.currentNetWorth.toFixed(2)}`, this.width - 60, boxY + 55);
    ctx.textAlign = 'left';
  }
}
