import { Client, GatewayIntentBits, Message, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { ethers } from 'ethers';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Aave V3 Pool contract on BSC
const AAVE_POOL_ADDRESS = '0x6807dc923806fE8Fd134338EABCA509979a7e0cB';

// Token configurations
const TOKENS: Record<string, { address: string; aTokenAddress: string; decimals: number; coingeckoId: string }> = {
  USDT: {
    address: '0x55d398326f99059fF775485246999027B3197955',
    aTokenAddress: '0xa9251ca9DE909CB71783723713B21E4233fbf1B1',
    decimals: 18,
    coingeckoId: 'tether',
  },
  USDC: {
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    aTokenAddress: '0x00901a076785e0906d1028c7d6372d247bec7d61',
    decimals: 18,
    coingeckoId: 'usd-coin',
  },
  WBNB: {
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    aTokenAddress: '0x9B00a09492a626678E5A3009982191586C444Df9',
    decimals: 18,
    coingeckoId: 'wbnb',
  },
  BTCB: {
    address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    aTokenAddress: '0x56a7ddc4e848EbF43845854205ad71D5D5F72d3D',
    decimals: 18,
    coingeckoId: 'binance-bitcoin',
  },
  ETH: {
    address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    aTokenAddress: '0x2E94171493fAbE316b6205f1585779C887771E2F',
    decimals: 18,
    coingeckoId: 'ethereum',
  },
};

// Variable debt token addresses for borrowed assets (Aave V3 BNB)
// Source: https://github.com/bgd-labs/aave-address-book
const VARIABLE_DEBT_TOKENS: Record<string, string> = {
  USDT: '0xF8bb2Be50647447Fb355e3a77b81be4db64107cd',
  USDC: '0xcDBBEd5606d9c5C98eEedd67933991dC17F0c68d',
  WBNB: '0x0E76414d433ddfe8004d2A7505d218874875a996',
  BTCB: '0x7b1E82F4f542fbB25D64c5523Fe3e44aBe4F2702',
  ETH: '0x8FDea7891b4D6dbdc746309245B316aF691A636C',
};

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

// Aave Pool ABI for getUserAccountData
const AAVE_POOL_ABI = [
  'function getUserAccountData(address user) view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
];

// Multiple BSC RPC endpoints for fallback
const RPC_ENDPOINTS = [
  'https://bsc-dataseed1.binance.org',
  'https://bsc-dataseed2.binance.org',
  'https://bsc-dataseed3.binance.org',
  'https://bsc-dataseed4.binance.org',
  'https://bsc.publicnode.com',
  'https://binance.llamarpc.com',
];

function createProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.BSC_RPC_URL || RPC_ENDPOINTS[0];
  return new ethers.JsonRpcProvider(rpcUrl, {
    chainId: 56,
    name: 'bnb',
  });
}

let provider = createProvider();

interface Position {
  symbol: string;
  amount: number;
  value: number;
  price: number;
}

interface Portfolio {
  supplied: Position[];
  borrowed: Position[];
  totalSupplied: number;
  totalBorrowed: number;
  netWorth: number;
  healthFactor: number;
}

async function getTokenPrices(): Promise<Record<string, number>> {
  const ids = Object.values(TOKENS).map(t => t.coingeckoId).join(',');
  const response = await axios.get(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
  );

  const prices: Record<string, number> = {};
  for (const [symbol, config] of Object.entries(TOKENS)) {
    prices[symbol] = response.data[config.coingeckoId]?.usd || 0;
  }
  return prices;
}

async function getTokenBalance(tokenAddress: string, walletAddress: string, decimals: number): Promise<number> {
  // Try each RPC endpoint until one works
  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    try {
      const rpcProvider = new ethers.JsonRpcProvider(RPC_ENDPOINTS[i], {
        chainId: 56,
        name: 'bnb',
      });
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, rpcProvider);
      const balance = await contract.balanceOf(walletAddress);
      return parseFloat(ethers.formatUnits(balance, decimals));
    } catch (error) {
      if (i === RPC_ENDPOINTS.length - 1) {
        console.error(`Failed to get balance for ${tokenAddress}:`, error);
        return 0;
      }
      // Try next RPC
      continue;
    }
  }
  return 0;
}

async function getAaveAccountData(walletAddress: string): Promise<{ healthFactor: number; totalCollateral: number; totalDebt: number }> {
  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    try {
      const rpcProvider = new ethers.JsonRpcProvider(RPC_ENDPOINTS[i], {
        chainId: 56,
        name: 'bnb',
      });
      const poolContract = new ethers.Contract(AAVE_POOL_ADDRESS, AAVE_POOL_ABI, rpcProvider);
      const accountData = await poolContract.getUserAccountData(walletAddress);

      // Health factor is returned with 18 decimals
      const healthFactor = parseFloat(ethers.formatUnits(accountData.healthFactor, 18));
      // Collateral and debt are in USD with 8 decimals
      const totalCollateral = parseFloat(ethers.formatUnits(accountData.totalCollateralBase, 8));
      const totalDebt = parseFloat(ethers.formatUnits(accountData.totalDebtBase, 8));

      return { healthFactor, totalCollateral, totalDebt };
    } catch (error) {
      if (i === RPC_ENDPOINTS.length - 1) {
        console.error('Failed to get Aave account data:', error);
        return { healthFactor: Infinity, totalCollateral: 0, totalDebt: 0 };
      }
      continue;
    }
  }
  return { healthFactor: Infinity, totalCollateral: 0, totalDebt: 0 };
}

async function fetchPortfolio(walletAddress: string): Promise<Portfolio> {
  // Fetch prices and Aave account data in parallel
  const [prices, aaveData] = await Promise.all([
    getTokenPrices(),
    getAaveAccountData(walletAddress),
  ]);

  const supplied: Position[] = [];
  const borrowed: Position[] = [];

  // Fetch supplied positions (aToken balances)
  for (const [symbol, config] of Object.entries(TOKENS)) {
    const balance = await getTokenBalance(config.aTokenAddress, walletAddress, config.decimals);
    if (balance > 0.000001) {
      const price = prices[symbol] || 0;
      supplied.push({
        symbol,
        amount: balance,
        price,
        value: balance * price,
      });
    }
  }

  // Fetch borrowed positions (variable debt token balances)
  for (const [symbol, debtTokenAddress] of Object.entries(VARIABLE_DEBT_TOKENS)) {
    const config = TOKENS[symbol];
    const balance = await getTokenBalance(debtTokenAddress, walletAddress, config.decimals);
    if (balance > 0.000001) {
      const price = prices[symbol] || 0;
      borrowed.push({
        symbol,
        amount: balance,
        price,
        value: balance * price,
      });
    }
  }

  const totalSupplied = supplied.reduce((sum, p) => sum + p.value, 0);
  const totalBorrowed = borrowed.reduce((sum, p) => sum + p.value, 0);
  const netWorth = totalSupplied - totalBorrowed;

  // Use the real health factor from Aave contract
  const healthFactor = aaveData.healthFactor;

  return {
    supplied,
    borrowed,
    totalSupplied,
    totalBorrowed,
    netWorth,
    healthFactor,
  };
}

function createPortfolioEmbed(walletAddress: string, portfolio: Portfolio): EmbedBuilder {
  // Determine color based on health factor
  let healthColor: number;
  let hfStatus: string;
  let hfEmoji: string;

  if (portfolio.healthFactor === Infinity || portfolio.healthFactor > 1000000) {
    healthColor = 0x00d4aa; // Green
    hfStatus = 'No Debt';
    hfEmoji = '🟢';
  } else if (portfolio.healthFactor > 2) {
    healthColor = 0x00d4aa; // Green
    hfStatus = 'Safe';
    hfEmoji = '🟢';
  } else if (portfolio.healthFactor > 1.5) {
    healthColor = 0xffaa00; // Yellow
    hfStatus = 'Caution';
    hfEmoji = '🟡';
  } else if (portfolio.healthFactor > 1.1) {
    healthColor = 0xff8800; // Orange
    hfStatus = 'Warning';
    hfEmoji = '🟠';
  } else {
    healthColor = 0xff4444; // Red
    hfStatus = 'LIQUIDATION RISK!';
    hfEmoji = '🔴';
  }

  const embed = new EmbedBuilder()
    .setTitle('🏦 Aave V3 Portfolio - BSC')
    .setDescription(`**Wallet:** \`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\``)
    .setColor(healthColor)
    .setTimestamp()
    .setFooter({ text: 'Aave PNL Bot • Data from BSC' });

  // Health Factor - Always show prominently
  const hfDisplay = (portfolio.healthFactor === Infinity || portfolio.healthFactor > 1000000)
    ? '∞'
    : portfolio.healthFactor.toFixed(2);

  embed.addFields({
    name: '❤️ Health Factor',
    value: `\`\`\`\n${hfEmoji} ${hfDisplay} - ${hfStatus}\n\`\`\``,
    inline: false,
  });

  // Summary row
  embed.addFields(
    {
      name: '💰 Net Worth',
      value: `**$${portfolio.netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**`,
      inline: true,
    },
    {
      name: '💎 Supplied',
      value: `$${portfolio.totalSupplied.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      inline: true,
    },
    {
      name: '🔴 Borrowed',
      value: `$${portfolio.totalBorrowed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      inline: true,
    }
  );

  // Supplied Assets
  if (portfolio.supplied.length > 0) {
    const suppliedList = portfolio.supplied
      .map(p => `• **${p.symbol}**: ${p.amount.toFixed(4)} (\$${p.value.toFixed(2)})`)
      .join('\n');
    embed.addFields({
      name: '📊 Supplied Assets',
      value: suppliedList,
      inline: true,
    });
  }

  // Borrowed Assets
  if (portfolio.borrowed.length > 0) {
    const borrowedList = portfolio.borrowed
      .map(p => `• **${p.symbol}**: ${p.amount.toFixed(4)} (\$${p.value.toFixed(2)})`)
      .join('\n');
    embed.addFields({
      name: '📉 Borrowed Assets',
      value: borrowedList,
      inline: true,
    });
  } else {
    embed.addFields({
      name: '📉 Borrowed Assets',
      value: '_None_',
      inline: true,
    });
  }

  return embed;
}

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`✅ Bot is online as ${client.user?.tag}`);
  console.log(`📌 Invite URL: https://discord.com/api/oauth2/authorize?client_id=${client.user?.id}&permissions=274877910016&scope=bot`);
  console.log(`\n📋 Commands:`);
  console.log(`   !track <wallet_address> - Track Aave portfolio`);
  console.log(`   !help - Show help message\n`);
});

client.on('messageCreate', async (message: Message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  const content = message.content.trim();

  // !track command
  if (content.startsWith('!track')) {
    const args = content.slice(6).trim();

    // Extract wallet address (with or without quotes)
    const walletMatch = args.match(/["']?(0x[a-fA-F0-9]{40})["']?/);

    if (!walletMatch) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff4444)
            .setTitle('❌ Invalid Command')
            .setDescription('Please provide a valid wallet address.\n\n**Usage:**\n`!track 0x1234...abcd`\n`!track "0x1234...abcd"`')
        ]
      });
      return;
    }

    const walletAddress = walletMatch[1];

    // Send loading message
    const loadingMsg = await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('⏳ Fetching Portfolio...')
          .setDescription(`Loading Aave positions for \`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\``)
      ]
    });

    try {
      const portfolio = await fetchPortfolio(walletAddress);

      if (portfolio.supplied.length === 0 && portfolio.borrowed.length === 0) {
        await loadingMsg.edit({
          embeds: [
            new EmbedBuilder()
              .setColor(0xffaa00)
              .setTitle('📭 No Positions Found')
              .setDescription(`No Aave V3 positions found for this wallet on BSC.\n\nWallet: \`${walletAddress}\``)
          ]
        });
        return;
      }

      const embed = createPortfolioEmbed(walletAddress, portfolio);
      await loadingMsg.edit({ embeds: [embed] });

    } catch (error: any) {
      console.error('Error fetching portfolio:', error);
      await loadingMsg.edit({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff4444)
            .setTitle('❌ Error')
            .setDescription(`Failed to fetch portfolio: ${error.message}`)
        ]
      });
    }
  }

  // !help command
  if (content === '!help' || content === '!aave') {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00d4aa)
          .setTitle('🏦 Aave PNL Bot - Help')
          .setDescription('Track your Aave V3 positions on BSC')
          .addFields(
            {
              name: '📊 Track Portfolio',
              value: '`!track <wallet_address>`\nExample: `!track 0x1234...abcd`',
              inline: false,
            },
            {
              name: '📋 Supported Tokens',
              value: 'USDT, USDC, WBNB, BTCB, ETH',
              inline: false,
            },
            {
              name: '❤️ Health Factor',
              value: '🟢 > 2.0 Safe\n🟡 1.5-2.0 Caution\n🔴 < 1.5 At Risk',
              inline: false,
            }
          )
          .setFooter({ text: 'Aave V3 on BSC' })
      ]
    });
  }
});

// Start the bot
const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error('❌ DISCORD_BOT_TOKEN is not set in .env.local');
  process.exit(1);
}

client.login(token).catch((error) => {
  console.error('❌ Failed to login:', error.message);
  process.exit(1);
});
