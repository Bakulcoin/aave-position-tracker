# Setup Guide

This guide will help you set up the Aave PNL Generator from scratch.

## Step 1: Prerequisites

Make sure you have:
- Node.js 18 or higher installed
- A BscScan API key (get one at https://bscscan.com/apis)
- A Discord account (optional, for bot integration)

## Step 2: Clone and Install

```bash
git clone <your-repo-url>
cd aave-pnl-generator
npm install
```

## Step 3: Set Up Discord Bot (Optional)

If you want to enable the "Share to Discord" feature:

### 3.1 Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give it a name (e.g., "Aave PNL Bot")
4. Click "Create"

### 3.2 Create a Bot

1. In your application, go to "Bot" in the left sidebar
2. Click "Add Bot"
3. Click "Yes, do it!"

### 3.3 Get Your Bot Token

1. Under the bot's username, click "Reset Token"
2. Copy the token - **keep this secret!**
3. Save it for the environment variables

### 3.4 Configure Bot Settings

1. Scroll down to "Privileged Gateway Intents"
2. You can leave these disabled unless you need them
3. Under "Bot Permissions", ensure the bot can:
   - Send Messages
   - Attach Files
   - Embed Links

### 3.5 Invite the Bot to Your Server

1. Go to "OAuth2" > "URL Generator" in the left sidebar
2. Under "Scopes", check "bot"
3. Under "Bot Permissions", check:
   - Send Messages
   - Attach Files
   - Embed Links
4. Copy the generated URL at the bottom
5. Open the URL in a new tab
6. Select your server and click "Authorize"

### 3.6 Get Your Channel ID

1. Open Discord
2. Go to User Settings > Advanced
3. Enable "Developer Mode"
4. Right-click on the channel where you want the bot to post
5. Click "Copy ID"
6. Save this for the environment variables

## Step 4: Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# BscScan API Key (Get from https://bscscan.com/apis)
BSCSCAN_API_KEY=your_bscscan_api_key_here

# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_bot_token_from_step_3.3
DISCORD_CHANNEL_ID=your_channel_id_from_step_3.6

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 5: Run the Application

```bash
npm run dev
```

Visit http://localhost:3000 to see your app!

## Step 6: Test the Application

1. **Generate Report**:
   - Enter a BSC wallet address that has Aave activity
   - Click "Fetch Positions"
   - Wait for the positions to load

2. **Download Card**:
   - Click "Download PNL Card" to save the image

3. **Share to Discord** (if configured):
   - Click "Share to Discord"
   - Check your Discord channel for the message
   - The bot will post an embed with PNL summary and the card image

## Step 7: Deploy to Vercel

1. **Push to GitHub**:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Import to Vercel**:
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository

3. **Add Environment Variables in Vercel**:
   - Go to Project Settings > Environment Variables
   - Add all variables from your `.env.local`:
     - `BSCSCAN_API_KEY`
     - `DISCORD_BOT_TOKEN`
     - `DISCORD_CHANNEL_ID`
     - `NEXT_PUBLIC_APP_URL` (set to your Vercel domain)
   - Make sure to add them for Production, Preview, and Development

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app is now live!

## Troubleshooting

### BscScan API Issues
- Make sure your API key is valid
- Check that you haven't exceeded the rate limit (5 calls/second)
- Wait a minute and try again if rate limited

### Discord Bot Issues

**Bot not responding:**
- Verify the bot token is correct (no extra spaces)
- Check that the bot has been invited to the server
- Make sure the bot is online (check Discord)

**"Invalid channel" error:**
- Verify the channel ID is correct
- Make sure the bot has access to the channel
- Check that the bot has "View Channel" permission

**"Missing permissions" error:**
- Go to your Discord server settings
- Navigate to the channel settings
- Ensure the bot role has:
  - Send Messages
  - Attach Files
  - Embed Links

**Bot connects but doesn't post:**
- Check the server logs for errors
- Verify the channel ID is for a text channel (not voice)
- Make sure the channel isn't read-only for the bot

### PNL Generation Issues
- Verify the wallet address is valid (starts with 0x, 42 characters)
- Check that the wallet has Aave activity on BSC (not other chains)
- Some wallets may not have any Aave transactions

### Build/Runtime Issues
- Make sure all dependencies are installed: `npm install`
- Clear the Next.js cache: `rm -rf .next`
- Check Node.js version: `node --version` (should be 18+)

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Check the terminal for server-side errors
3. Verify all environment variables are set correctly
4. Make sure the wallet address has Aave activity on BSC

## Next Steps

- Customize the UI to match your brand
- Add support for more tokens
- Implement additional sharing options (Twitter, Telegram)
- Add slash commands to the Discord bot
- Set up monitoring and analytics
