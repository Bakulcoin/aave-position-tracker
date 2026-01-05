# Aave PNL Generator for BSC

Generate beautiful PNL (Profit and Loss) reports for your Aave positions on Binance Smart Chain.

![Aave PNL Generator](https://img.shields.io/badge/Aave-PNL%20Generator-00D4AA?style=for-the-badge&logo=aave&logoColor=white)

## Features

- 📊 **Automatic Position Tracking** - Analyzes all your Aave transactions on BSC
- 💰 **Real-time PNL Calculation** - Calculates profit/loss based on initial and current prices
- 🎨 **Beautiful Card Generation** - Creates visual PNL cards as PNG images
- 🔍 **Detailed Breakdown** - Shows supplied and borrowed positions with full metrics
- 🚀 **Easy to Use** - Simple CLI interface, just provide your wallet address

## How It Works

1. **User submits wallet address** via CLI
2. **System fetches Aave transactions** from BscScan API
3. **Analyzes initial positions** - Tracks when you supplied/borrowed tokens and at what price
4. **Analyzes current positions** - Gets current token prices and position values
5. **Generates PNL card** - Creates a beautiful visual report with all metrics

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd aave-pnl-generator

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. (Optional but recommended) Add your BscScan API key to `.env`:
```
BSCSCAN_API_KEY=your_api_key_here
```

Get a free API key at: https://bscscan.com/apis

## Usage

### Basic Usage

```bash
npm run generate 0xYourWalletAddress
```

### With Custom Output Path

```bash
npm run generate 0xYourWalletAddress --output my-custom-pnl.png
```

### Development Mode

```bash
npm run dev 0xYourWalletAddress
```

## Output

The tool generates:

1. **Console Output** - Detailed PNL breakdown in your terminal
2. **PNG Image** - Visual PNL card saved to `./output/pnl-card.png` (or custom path)

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
src/
├── config/
│   └── aave.ts                 # Aave contract addresses and configurations
├── services/
│   ├── bscscan.service.ts      # Fetches blockchain data via BscScan API
│   ├── aave-parser.service.ts  # Parses Aave transactions
│   ├── price.service.ts        # Fetches token prices (CoinGecko)
│   ├── pnl-calculator.service.ts # Calculates PNL metrics
│   ├── image-generator.service.ts # Generates PNL card images
│   └── aave-pnl.service.ts     # Main orchestration service
├── types/
│   └── index.ts                # TypeScript type definitions
└── index.ts                    # CLI entry point
```

## Data Sources

- **Blockchain Data**: BscScan API
- **Price Data**: CoinGecko API (free tier)
- **Historical Prices**: CoinGecko historical data

## Limitations

- Only tracks Aave V3 positions on BSC
- Historical price data may have delays due to API rate limits
- Free tier API limits apply (BscScan: 5 calls/sec, CoinGecko: 10-50 calls/min)

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

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev 0xYourAddress

# Build for production
npm run build

# Run built version
npm start 0xYourAddress
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Disclaimer

This tool is for informational purposes only. Always verify PNL calculations independently. Not financial advice.

## Credits

Built with:
- [ethers.js](https://docs.ethers.org/) - Ethereum library
- [node-canvas](https://github.com/Automattic/node-canvas) - Canvas implementation for Node.js
- [axios](https://axios-http.com/) - HTTP client
- [BscScan API](https://bscscan.com/apis) - Blockchain data
- [CoinGecko API](https://www.coingecko.com/en/api) - Price data
