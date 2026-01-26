import { Client, GatewayIntentBits, Message, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { ethers } from 'ethers';
import axios from 'axios';
import * as dotenv from 'dotenv';
import {
  CHAIN_IDS,
  ChainId,
  getChainConfig,
  AAVE_TOKENS_BSC,
  AAVE_TOKENS_BASE,
  AAVE_CONTRACTS_BSC,
  AAVE_CONTRACTS_BASE,
  RPC_ENDPOINTS,
} from '../lib/config/aave';

dotenv.config({ path: '.env.local' });

// CoinGecko ID mapping for tokens
const COINGECKO_IDS: Record<string, string> = {
  // BSC tokens
  USDT: 'tether',
  USDC: 'usd-coin',
  WBNB: 'wbnb',
  BTCB: 'binance-bitcoin',
  ETH: 'ethereum',
  FDUSD: 'first-digital-usd',
  CAKE: 'pancakeswap-token',
  wstETH: 'wrapped-steth',
  // Base tokens
  WETH: 'ethereum',
  USDbC: 'usd-coin',
  cbETH: 'coinbase-wrapped-staked-eth',
  weETH: 'wrapped-eeth',
  cbBTC: 'coinbase-wrapped-btc',
  ezETH: 'renzo-restaked-eth',
  GHO: 'gho',
  wrsETH: 'wrapped-rseth',
  LBTC: 'lombard-staked-btc',
  EURC: 'euro-coin',
  AAVE: 'aave',
  tBTC: 'tbtc',
};

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

// Aave Pool ABI for getUserAccountData
const AAVE_POOL_ABI = [
  'function getUserAccountData(address user) view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
];

function createProvider(chainId: ChainId): ethers.JsonRpcProvider {
  const chainConfig = getChainConfig(chainId);
  const envRpcUrl = chainId === CHAIN_IDS.BSC
    ? process.env.BSC_RPC_URL
    : chainId === CHAIN_IDS.BASE
      ? process.env.BASE_RPC_URL
      : undefined;

  const rpcUrl = envRpcUrl || chainConfig.rpcEndpoints[0];
  return new ethers.JsonRpcProvider(rpcUrl, {
    chainId: chainConfig.chainId,
    name: chainConfig.name.toLowerCase().replace(' ', '-'),
  });
}

function getTokensForChain(chainId: ChainId) {
  return chainId === CHAIN_IDS.BASE ? AAVE_TOKENS_BASE : AAVE_TOKENS_BSC;
}

function getPoolAddressForChain(chainId: ChainId): string {
  return chainId === CHAIN_IDS.BASE ? AAVE_CONTRACTS_BASE.POOL : AAVE_CONTRACTS_BSC.POOL;
}

function getRpcEndpointsForChain(chainId: ChainId): string[] {
  return RPC_ENDPOINTS[chainId] || RPC_ENDPOINTS[CHAIN_IDS.BSC];
}

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
  chainId: ChainId;
  chainName: string;
}

async function getTokenPrices(chainId: ChainId): Promise<Record<string, number>> {
  const tokens = getTokensForChain(chainId);
  const symbols = Object.keys(tokens);
  const ids = [...new Set(symbols.map(s => COINGECKO_IDS[s]).filter(Boolean))].join(',');

  const response = await axios.get(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
  );

  const prices: Record<string, number> = {};
  for (const symbol of symbols) {
    const coingeckoId = COINGECKO_IDS[symbol];
    prices[symbol] = coingeckoId ? (response.data[coingeckoId]?.usd || 0) : 0;
  }
  return prices;
}

async function getTokenBalance(tokenAddress: string, walletAddress: string, decimals: number, chainId: ChainId): Promise<number> {
  const rpcEndpoints = getRpcEndpointsForChain(chainId);
  const chainConfig = getChainConfig(chainId);

  // Try each RPC endpoint until one works
  for (let i = 0; i < rpcEndpoints.length; i++) {
    try {
      const rpcProvider = new ethers.JsonRpcProvider(rpcEndpoints[i], {
        chainId: chainConfig.chainId,
        name: chainConfig.name.toLowerCase().replace(' ', '-'),
      });
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, rpcProvider);
      const balance = await contract.balanceOf(walletAddress);
      return parseFloat(ethers.formatUnits(balance, decimals));
    } catch (error) {
      if (i === rpcEndpoints.length - 1) {
        console.error(`Failed to get balance for ${tokenAddress}:`, error);
        return 0;
      }
      // Try next RPC
      continue;
    }
  }
  return 0;
}

async function getAaveAccountData(walletAddress: string, chainId: ChainId): Promise<{ healthFactor: number; totalCollateral: number; totalDebt: number }> {
  const rpcEndpoints = getRpcEndpointsForChain(chainId);
  const chainConfig = getChainConfig(chainId);
  const poolAddress = getPoolAddressForChain(chainId);

  for (let i = 0; i < rpcEndpoints.length; i++) {
    try {
      const rpcProvider = new ethers.JsonRpcProvider(rpcEndpoints[i], {
        chainId: chainConfig.chainId,
        name: chainConfig.name.toLowerCase().replace(' ', '-'),
      });
      const poolContract = new ethers.Contract(poolAddress, AAVE_POOL_ABI, rpcProvider);
      const accountData = await poolContract.getUserAccountData(walletAddress);

      // Health factor is returned with 18 decimals
      const healthFactor = parseFloat(ethers.formatUnits(accountData.healthFactor, 18));
      // Collateral and debt are in USD with 8 decimals
      const totalCollateral = parseFloat(ethers.formatUnits(accountData.totalCollateralBase, 8));
      const totalDebt = parseFloat(ethers.formatUnits(accountData.totalDebtBase, 8));

      return { healthFactor, totalCollateral, totalDebt };
    } catch (error) {
      if (i === rpcEndpoints.length - 1) {
        console.error('Failed to get Aave account data:', error);
        return { healthFactor: Infinity, totalCollateral: 0, totalDebt: 0 };
      }
      continue;
    }
  }
  return { healthFactor: Infinity, totalCollateral: 0, totalDebt: 0 };
}

async function fetchPortfolio(walletAddress: string, chainId: ChainId = CHAIN_IDS.BSC): Promise<Portfolio> {
  const tokens = getTokensForChain(chainId);
  const chainConfig = getChainConfig(chainId);

  // Fetch prices and Aave account data in parallel
  const [prices, aaveData] = await Promise.all([
    getTokenPrices(chainId),
    getAaveAccountData(walletAddress, chainId),
  ]);

  const supplied: Position[] = [];
  const borrowed: Position[] = [];

  // Fetch supplied positions (aToken balances)
  for (const [symbol, tokenInfo] of Object.entries(tokens)) {
    const balance = await getTokenBalance(tokenInfo.aToken, walletAddress, tokenInfo.decimals, chainId);
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
  for (const [symbol, tokenInfo] of Object.entries(tokens)) {
    const balance = await getTokenBalance(tokenInfo.debtToken, walletAddress, tokenInfo.decimals, chainId);
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
    chainId,
    chainName: chainConfig.name,
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
    .setTitle(`🏦 Aave V3 Portfolio - ${portfolio.chainName}`)
    .setDescription(`**Wallet:** \`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\``)
    .setColor(healthColor)
    .setTimestamp()
    .setFooter({ text: `Aave PNL Bot • Data from ${portfolio.chainName}` });

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
  console.log(`   !track <wallet_address> [chain] - Track Aave portfolio (chain: bsc, base)`);
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
            .setDescription('Please provide a valid wallet address.\n\n**Usage:**\n`!track 0x1234...abcd [chain]`\n`!track 0x1234...abcd base`\n\n**Supported chains:** bsc (default), base')
        ]
      });
      return;
    }

    const walletAddress = walletMatch[1];

    // Check for chain parameter after the wallet address
    const argsAfterWallet = args.slice(args.indexOf(walletAddress) + walletAddress.length).trim().toLowerCase();
    let chainId: ChainId = CHAIN_IDS.BSC; // Default to BSC

    if (argsAfterWallet.includes('base')) {
      chainId = CHAIN_IDS.BASE;
    } else if (argsAfterWallet.includes('bsc') || argsAfterWallet.includes('bnb')) {
      chainId = CHAIN_IDS.BSC;
    }

    const chainConfig = getChainConfig(chainId);

    // Send loading message
    const loadingMsg = await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('⏳ Fetching Portfolio...')
          .setDescription(`Loading Aave positions on **${chainConfig.name}** for \`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\``)
      ]
    });

    try {
      const portfolio = await fetchPortfolio(walletAddress, chainId);

      if (portfolio.supplied.length === 0 && portfolio.borrowed.length === 0) {
        await loadingMsg.edit({
          embeds: [
            new EmbedBuilder()
              .setColor(0xffaa00)
              .setTitle('📭 No Positions Found')
              .setDescription(`No Aave V3 positions found for this wallet on ${chainConfig.name}.\n\nWallet: \`${walletAddress}\``)
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
          .setDescription('Track your Aave V3 positions on multiple chains')
          .addFields(
            {
              name: '📊 Track Portfolio',
              value: '`!track <wallet_address> [chain]`\nExamples:\n`!track 0x1234...abcd` (BSC default)\n`!track 0x1234...abcd base`\n`!track 0x1234...abcd bsc`',
              inline: false,
            },
            {
              name: '🔗 Supported Chains',
              value: '**BSC (BNB Chain)**: USDT, USDC, WBNB, BTCB, ETH, FDUSD, CAKE, wstETH\n**Base**: WETH, USDC, USDbC, cbETH, wstETH, weETH, cbBTC, ezETH, GHO, EURC, AAVE',
              inline: false,
            },
            {
              name: '❤️ Health Factor',
              value: '🟢 > 2.0 Safe\n🟡 1.5-2.0 Caution\n🔴 < 1.5 At Risk',
              inline: false,
            }
          )
          .setFooter({ text: 'Aave V3 on BSC & Base' })
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
