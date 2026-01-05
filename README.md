# Aave PNL Generator for BSC

A full-stack web application to generate beautiful PNL (Profit and Loss) reports for your Aave positions on Binance Smart Chain.

![Aave PNL Generator](https://img.shields.io/badge/Aave-PNL%20Generator-00D4AA?style=for-the-badge&logo=aave&logoColor=white)

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **Blockchain Data**: BscScan API
- **Price Data**: CoinGecko API

## Features

- 🔐 **User Authentication** - Secure sign-up and login with Supabase
- 📊 **Automatic Position Tracking** - Analyzes all your Aave transactions on BSC
- 💰 **Real-time PNL Calculation** - Calculates profit/loss based on initial and current prices
- 🎨 **Beautiful Card Generation** - Creates visual PNL cards as PNG images
- 📱 **Responsive Dashboard** - View all your historical reports
- 💾 **Report History** - All reports saved to your account
- 🔍 **Detailed Breakdown** - Shows supplied and borrowed positions with full metrics

## How It Works

1. **User signs up/logs in** via Supabase authentication
2. **User submits wallet address** through the web dashboard
3. **System fetches Aave transactions** from BscScan API
4. **Analyzes initial positions** - Tracks when you supplied/borrowed tokens and at what price
5. **Analyzes current positions** - Gets current token prices and position values
6. **Generates PNL card** - Creates a beautiful visual report with all metrics
7. **Stores in database** - Report saved to Supabase for future reference

## Quick Start

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- BscScan API key (optional but recommended)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd aave-pnl-generator

# Install dependencies
npm install
```

### Configuration

1. **Set up Supabase**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings > API to get your keys
   - Run the SQL migration from `supabase/migrations/001_initial_schema.sql` in the SQL Editor

2. **Configure Environment Variables**:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:
```env
# BscScan API Key (Get from https://bscscan.com/apis)
BSCSCAN_API_KEY=your_bscscan_api_key

# Supabase (Get from https://supabase.com/dashboard/project/_/settings/api)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

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
│   │   ├── generate-pnl/       # PNL generation endpoint
│   │   └── reports/            # Reports fetching endpoint
│   ├── auth/                   # Authentication pages
│   │   ├── login/              # Login/signup page
│   │   └── callback/           # Auth callback handler
│   ├── dashboard/              # Dashboard page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   └── globals.css             # Global styles
├── components/                 # React components
│   └── DashboardClient.tsx     # Dashboard client component
├── lib/                        # Core business logic
│   ├── config/
│   │   └── aave.ts             # Aave contract addresses
│   ├── services/
│   │   ├── bscscan.service.ts  # Blockchain data fetching
│   │   ├── aave-parser.service.ts # Transaction parsing
│   │   ├── price.service.ts    # Price data fetching
│   │   ├── pnl-calculator.service.ts # PNL calculation
│   │   ├── image-generator.service.ts # Card generation
│   │   └── aave-pnl.service.ts # Main orchestrator
│   ├── supabase/               # Supabase client configs
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── middleware.ts       # Auth middleware
│   └── types/
│       └── index.ts            # TypeScript definitions
├── supabase/
│   └── migrations/             # Database migrations
│       └── 001_initial_schema.sql
├── cli/                        # CLI tool (optional)
│   └── index.ts
└── public/                     # Static assets
    └── pnl-cards/              # Generated PNL cards
```

## Database Schema

The application uses the following main tables:

- **profiles**: User profiles (extends Supabase auth.users)
- **pnl_reports**: Stores generated PNL reports
- **positions**: Detailed position data for each report
- **user_wallets**: Associates wallet addresses with users

All tables have Row Level Security (RLS) enabled for data protection.

## Data Sources

- **Blockchain Data**: BscScan API
- **Price Data**: CoinGecko API (free tier)
- **Historical Prices**: CoinGecko historical data
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth

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
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
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
- [Supabase](https://supabase.com/) - Backend as a Service
- [Vercel](https://vercel.com/) - Deployment platform
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [ethers.js](https://docs.ethers.org/) - Ethereum library
- [node-canvas](https://github.com/Automattic/node-canvas) - Canvas implementation
- [axios](https://axios-http.com/) - HTTP client
- [BscScan API](https://bscscan.com/apis) - Blockchain data
- [CoinGecko API](https://www.coingecko.com/en/api) - Price data
- [Lucide React](https://lucide.dev/) - Icon library
