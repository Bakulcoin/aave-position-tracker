import axios from 'axios';
import FormData from 'form-data';

interface PnLData {
  walletAddress: string;
  currentNetWorth: number;
  totalPnL: number;
  pnlPercentage: number;
  suppliedTotal: number;
  borrowedTotal: number;
}

interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer: {
    text: string;
  };
  timestamp: string;
  image?: {
    url: string;
  };
}

class DiscordBotService {
  private botToken: string;
  private channelId: string;
  private apiBase = 'https://discord.com/api/v10';

  constructor() {
    this.botToken = process.env.DISCORD_BOT_TOKEN || '';
    this.channelId = process.env.DISCORD_CHANNEL_ID || '';
  }

  isConfigured(): boolean {
    return !!(this.botToken && this.channelId);
  }

  async sendPnLCard(pnlData: PnLData, imageBuffer?: Buffer): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Discord bot not configured. Set DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID.' };
    }

    try {
      const isProfit = pnlData.totalPnL >= 0;
      const embedColor = isProfit ? 0x00d4aa : 0xff4444;
      const pnlEmoji = isProfit ? '📈' : '📉';
      const pnlSign = isProfit ? '+' : '';

      const embed: DiscordEmbed = {
        title: `${pnlEmoji} Aave V3 Portfolio - BSC`,
        description: `Wallet: \`${pnlData.walletAddress.slice(0, 6)}...${pnlData.walletAddress.slice(-4)}\``,
        color: embedColor,
        fields: [
          {
            name: '💰 Net Worth',
            value: `$${pnlData.currentNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            inline: true,
          },
          {
            name: `${isProfit ? '📈' : '📉'} PnL`,
            value: `${pnlSign}$${pnlData.totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pnlSign}${pnlData.pnlPercentage.toFixed(2)}%)`,
            inline: true,
          },
          {
            name: '💎 Supplied',
            value: `$${pnlData.suppliedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            inline: true,
          },
        ],
        footer: {
          text: 'Aave PNL Generator',
        },
        timestamp: new Date().toISOString(),
      };

      if (pnlData.borrowedTotal > 0) {
        embed.fields.push({
          name: '🔴 Borrowed',
          value: `$${pnlData.borrowedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          inline: true,
        });
      }

      const url = `${this.apiBase}/channels/${this.channelId}/messages`;

      if (imageBuffer) {
        // Send with image attachment using multipart form
        const formData = new FormData();
        const filename = `aave-pnl-${pnlData.walletAddress.slice(0, 8)}.png`;

        // Add image reference to embed
        embed.image = { url: `attachment://${filename}` };

        formData.append('payload_json', JSON.stringify({
          embeds: [embed],
        }));

        formData.append('files[0]', imageBuffer, {
          filename,
          contentType: 'image/png',
        });

        await axios.post(url, formData, {
          headers: {
            Authorization: `Bot ${this.botToken}`,
            ...formData.getHeaders(),
          },
        });
      } else {
        // Send without image
        await axios.post(
          url,
          { embeds: [embed] },
          {
            headers: {
              Authorization: `Bot ${this.botToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      return { success: true };
    } catch (error: any) {
      console.error('Discord bot error:', error.response?.data || error.message);

      // Handle common Discord API errors
      if (error.response?.status === 401) {
        return { success: false, error: 'Invalid bot token. Please check your DISCORD_BOT_TOKEN.' };
      }
      if (error.response?.status === 403) {
        return { success: false, error: 'Bot lacks permissions. Ensure it has Send Messages and Attach Files permissions.' };
      }
      if (error.response?.status === 404) {
        return { success: false, error: 'Channel not found. Please check your DISCORD_CHANNEL_ID.' };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send to Discord',
      };
    }
  }
}

export const discordService = new DiscordBotService();
