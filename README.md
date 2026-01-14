# Aave PNL Generator for BSC

A web application to generate beautiful PNL (Profit and Loss) reports for your Aave positions on Binance Smart Chain, with Discord bot integration for sharing.

![Aave PNL Generator](https://img.shields.io/badge/Aave-PNL%20Generator-00D4AA?style=for-the-badge&logo=aave&logoColor=white)

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Deployment**: Vercel
- **Blockchain Data**: BscScan API
- **Price Data**: CoinGecko API
- **Sharing**: Discord Bot (discord.js)

## Features

- 📊 **Automatic Position Tracking** - Analyzes all your Aave transactions on BSC
- 💰 **Real-time PNL Calculation** - Calculates profit/loss based on initial and current prices
- 🎨 **Beautiful Card Generation** - Creates visual PNL cards as PNG images
- 🤖 **Discord Bot Integration** - Share your PNL cards directly to Discord channels via bot
- 🔍 **Detailed Breakdown** - Shows supplied and borrowed positions with full metrics
- 📥 **Download Cards** - Save PNL cards as PNG images

## How It Works

1. **User submits wallet address** through the web interface
2. **System fetches Aave transactions** from BscScan API
3. **Analyzes initial positions** - Tracks when you supplied/borrowed tokens and at what price
4. **Analyzes current positions** - Gets current token prices and position values
5. **Generates PNL card** - Creates a beautiful visual report with all metrics
6. **Share to Discord** - Send your PNL card to any Discord channel via bot

## Quick Start

### Prerequisites

- Node.js 18+ installed
- BscScan API key (optional but recommended)
- Discord Bot Token and Channel ID (for sharing feature)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd aave-pnl-generator

# Install dependencies
npm install
```

### Configuration

1. **Configure Environment Variables**:
```bash
cp .env.example.example .env.local
```

Edit `.env.local` with your credentials:
```env
# BscScan API Key (Get from https://bscscan.com/apis)
BSCSCAN_API_KEY=your_bscscan_api_key

# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CHANNEL_ID=your_discord_channel_id

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. **Set up Discord Bot** (optional, for sharing):
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to "Bot" section and create a bot
   - Copy the Bot Token
   - Enable "Message Content Intent" if needed
   - Go to OAuth2 > URL Generator
   - Select "bot" scope and "Send Messages", "Attach Files" permissions
   - Use the generated URL to invite the bot to your server
   - Copy the Channel ID where you want the bot to post (Right-click channel > Copy ID)

3. **Run the development server**:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app!

## Deployment on Vercel

1. **Push to GitHub**: Push your code to a GitHub repository

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**:
   - Add all environment variables from `.env.local`
   - Make sure to add them in the Vercel dashboard

4. **Deploy**: Click "Deploy" and your app will be live!

## CLI Usage (Optional)

You can also use the CLI for quick PNL generation:

```bash
# Generate a PNL report
npm run generate-cli 0xYourWalletAddress

# With custom output path
npm run generate-cli 0xYourWalletAddress --output my-pnl.png
```

## Output

The tool generates:

1. **Console Output** - Detailed PNL breakdown in your terminal
2. **PNG Image** - Visual PNL card saved to `./output/pnl-card.png` (or custom path)
3. **Discord Message** - Share your PNL card to Discord (optional)

### Sample Output

```
💰 PNL Summary:
   Initial Net Worth: $10,000.00
   Current Net Worth: $12,256.74
   Total PNL: $2,256.74
   PNL %: 22.57%

📋 Detailed Position Breakdown:
==================================================

💎 SUPPLIED ASSETS:
   USDT:
      Amount: 5000.000000
      Initial Price: $1.00
      Current Price: $1.00
      Initial Value: $5000.00
      Current Value: $5000.00
      P&L: $0.00

🔴 BORROWED ASSETS:
   (none)
```

### PNL Card Image

The generated image includes:
- Wallet address
- Initial net worth
- Current net worth
- Total PNL in USD
- PNL percentage
- List of supplied and borrowed assets

## Supported Tokens

Currently supports these tokens on BSC:
- USDT
- USDC
- WBNB
- BTCB
- ETH

## Architecture

```
aave-pnl-generator/
├── app/                        # Next.js App Router
│   ├── api/                    # API Routes
│   │   ├── fetch-positions/    # Position fetching endpoint
│   │   ├── generate-pnl-card/  # PNL card generation endpoint
│   │   └── share-discord/      # Discord bot sharing endpoint
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   └── globals.css             # Global styles
├── components/                 # React components
│   └── AavePositionsView.tsx   # Positions display component
├── lib/                        # Core business logic
│   ├── config/
│   │   └── aave.ts             # Aave contract addresses
│   ├── services/
│   │   ├── bscscan.service.ts  # Blockchain data fetching
│   │   ├── aave-parser.service.ts # Transaction parsing
│   │   ├── price.service.ts    # Price data fetching
│   │   ├── pnl-calculator.service.ts # PNL calculation
│   │   ├── image-generator.service.ts # Card generation
│   │   ├── discord.service.ts  # Discord bot integration
│   │   └── aave-pnl.service.ts # Main orchestrator
│   └── types/
│       └── index.ts            # TypeScript definitions
├── cli/                        # CLI tool (optional)
│   └── index.ts
└── public/                     # Static assets
```

## Discord Bot Integration

The app uses a Discord bot to share PNL cards:

1. **Create Bot**: Set up a bot in the Discord Developer Portal
2. **Configure**: Add bot token and channel ID to environment variables
3. **Invite Bot**: Use OAuth2 URL to add the bot to your server
4. **Share**: Click "Share to Discord" button after generating a report

The Discord message includes:
- An embedded card with PNL summary (color-coded: green for profit, red for loss)
- The PNL card image as an attachment
- Wallet address and timestamp

### Required Bot Permissions
- Send Messages
- Attach Files
- Embed Links

## Data Sources

- **Blockchain Data**: BscScan API
- **Price Data**: CoinGecko API (free tier)
- **Historical Prices**: CoinGecko historical data

## Limitations

- Only tracks Aave V3 positions on BSC
- Historical price data may have delays due to API rate limits
- Free tier API limits apply (BscScan: 5 calls/sec, CoinGecko: 10-50 calls/min)
- Supports USDT, USDC, WBNB, BTCB, and ETH tokens

## Troubleshooting

### "No Aave transactions found"
- Make sure you're using the correct wallet address
- Verify the wallet has Aave activity on BSC (not other chains)

### "Rate limit exceeded"
- Add a BscScan API key to your `.env` file
- Wait a few minutes between requests

### "Invalid wallet address"
- Ensure the address starts with `0x` and is 42 characters long
- Addresses are case-insensitive

### Discord bot not working
- Verify your bot token is correct
- Check that the channel ID is valid
- Ensure the bot has been invited to the server
- Verify the bot has "Send Messages" and "Attach Files" permissions in the channel
- Check server logs for connection errors

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Run CLI tool
npm run generate-cli 0xYourAddress
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BSCSCAN_API_KEY` | BscScan API key for fetching transactions | Recommended |
| `DISCORD_BOT_TOKEN` | Discord bot token for sharing | Optional |
| `DISCORD_CHANNEL_ID` | Discord channel ID where bot posts | Optional |
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Disclaimer

This tool is for informational purposes only. Always verify PNL calculations independently. Not financial advice.

## Credits

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Vercel](https://vercel.com/) - Deployment platform
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [ethers.js](https://docs.ethers.org/) - Ethereum library
- [discord.js](https://discord.js.org/) - Discord bot library
- [axios](https://axios-http.com/) - HTTP client
- [BscScan API](https://bscscan.com/apis) - Blockchain data
- [CoinGecko API](https://www.coingecko.com/en/api) - Price data
- [Lucide React](https://lucide.dev/) - Icon library
