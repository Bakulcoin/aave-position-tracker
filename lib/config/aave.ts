// Chain IDs
export const CHAIN_IDS = {
  BSC: 56,
  BASE: 8453,
} as const;

export type ChainId = typeof CHAIN_IDS[keyof typeof CHAIN_IDS];

// Token info type
export interface TokenInfo {
  address: string;
  aToken: string;
  debtToken: string;
  decimals: number;
  symbol: string;
}

// Token map type
export type TokenMap = Record<string, TokenInfo>;

// Aave V3 BSC Contract Addresses
export const AAVE_CONTRACTS_BSC = {
  POOL: '0x6807dc923806fE8Fd134338EABCA509979a7e0cB',
  POOL_ADDRESSES_PROVIDER: '0xff75B6da14FfbbfD355Daf7a2731456b3562Ba6D',
  POOL_DATA_PROVIDER: '0xc90Df74A7c16245c5F5C5870327Ceb38Fe5d5328',
  ORACLE: '0x39bc1bfDa2130d6Bb6DBEfd366939b4c7aa7C697',
};

// Aave V3 Base Contract Addresses
export const AAVE_CONTRACTS_BASE = {
  POOL: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
  POOL_ADDRESSES_PROVIDER: '0xe20fCBdBfFC4Dd138cE8b2E6FBb6CB49777ad64D',
  POOL_DATA_PROVIDER: '0x0F43731EB8d45A581f4a36DD74F5f358bc90C73A',
  ORACLE: '0x2Cc0Fc26eD4563A5ce5e8bdcfe1A2878676Ae156',
};

// Legacy export for backwards compatibility
export const AAVE_CONTRACTS = AAVE_CONTRACTS_BSC;

// Aave V3 BSC token addresses
// Source: https://github.com/bgd-labs/aave-address-book
export const AAVE_TOKENS_BSC = {
  USDT: {
    address: '0x55d398326f99059fF775485246999027B3197955',
    aToken: '0xa9251ca9DE909CB71783723713B21E4233fbf1B1',
    debtToken: '0xF8bb2Be50647447Fb355e3a77b81be4db64107cd',
    decimals: 18,
    symbol: 'USDT'
  },
  USDC: {
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    aToken: '0x00901a076785e0906d1028c7d6372d247bec7d61',
    debtToken: '0xcDBBEd5606d9c5C98eEedd67933991dC17F0c68d',
    decimals: 18,
    symbol: 'USDC'
  },
  WBNB: {
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    aToken: '0x9B00a09492a626678E5A3009982191586C444Df9',
    debtToken: '0x0E76414d433ddfe8004d2A7505d218874875a996',
    decimals: 18,
    symbol: 'WBNB'
  },
  BTCB: {
    address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    aToken: '0x56a7ddc4e848EbF43845854205ad71D5D5F72d3D',
    debtToken: '0x7b1E82F4f542fbB25D64c5523Fe3e44aBe4F2702',
    decimals: 18,
    symbol: 'BTCB'
  },
  ETH: {
    address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    aToken: '0x2E94171493fAbE316b6205f1585779C887771E2F',
    debtToken: '0x8FDea7891b4D6dbdc746309245B316aF691A636C',
    decimals: 18,
    symbol: 'ETH'
  },
  FDUSD: {
    address: '0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409',
    aToken: '0x75bd1A659bdC62e4C313950d44A2416faB43E785',
    debtToken: '0xE628B8a123e6037f1542e662B9F55141a16945C8',
    decimals: 18,
    symbol: 'FDUSD'
  },
  CAKE: {
    address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    aToken: '0x4199CC1F5ed0d796563d7CcB2e036253E2C18281',
    debtToken: '0xE20dBC7119c635B1B51462f844861258770e0699',
    decimals: 18,
    symbol: 'CAKE'
  },
  wstETH: {
    address: '0x26c5e01524d2E6280A48F2c50fF6De7e52E9611C',
    aToken: '0xBDFd4E51D3c14a232135f04988a42576eFb31519',
    debtToken: '0x2c391998308c56D7572A8F501D58CB56fB9Fe1C5',
    decimals: 18,
    symbol: 'wstETH'
  }
};

// Aave V3 Base token addresses
// Source: https://github.com/bgd-labs/aave-address-book
export const AAVE_TOKENS_BASE = {
  WETH: {
    address: '0x4200000000000000000000000000000000000006',
    aToken: '0xD4a0e0b9149BCee3C920d2E00b5dE09138fd8bb7',
    debtToken: '0x24e6e0795b3c7c71D965fCc4f371803d1c1DcA1E',
    decimals: 18,
    symbol: 'WETH'
  },
  USDC: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    aToken: '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB',
    debtToken: '0x59dca05b6c26dbd64b5381374aAaC5CD05644C28',
    decimals: 6,
    symbol: 'USDC'
  },
  USDbC: {
    address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    aToken: '0x0a1d576f3eFeF75b330424287a95A366e8281D54',
    debtToken: '0x7376b2F323dC56fCd4C191B34163ac8a84702DAB',
    decimals: 6,
    symbol: 'USDbC'
  },
  cbETH: {
    address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
    aToken: '0xcf3D55c10DB69f28fD1A75Bd73f3D8A2d9c595ad',
    debtToken: '0x1DabC36f19909425f654777249815c073E8Fd79F',
    decimals: 18,
    symbol: 'cbETH'
  },
  wstETH: {
    address: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
    aToken: '0x99CBC45ea5bb7eF3a5BC08FB1B7E56bB2442Ef0D',
    debtToken: '0x41A7C3f5904ad176dACbb1D99101F59ef0811DC1',
    decimals: 18,
    symbol: 'wstETH'
  },
  weETH: {
    address: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A',
    aToken: '0x7C307e128efA31F540F2E2d976C995E0B65F51F6',
    debtToken: '0x8D2e3F1f4b38AA9f1ceD22ac06019c7561B03901',
    decimals: 18,
    symbol: 'weETH'
  },
  cbBTC: {
    address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
    aToken: '0xBdb9300b7CDE636d9cD4AFF00f6F009fFBBc8EE6',
    debtToken: '0x05e08702028de6AaD395DC6478b554a56920b9AD',
    decimals: 8,
    symbol: 'cbBTC'
  },
  ezETH: {
    address: '0x2416092f143378750bb29b79eD961ab195CcEea5',
    aToken: '0xDD5745756C2de109183c6B5bB886F9207bEF114D',
    debtToken: '0xbc4f5631f2843488792e4F1660d0A51Ba489bdBd',
    decimals: 18,
    symbol: 'ezETH'
  },
  GHO: {
    address: '0x6Bb7a212910682DCFdbd5BCBb3e28FB4E8da10Ee',
    aToken: '0x067ae75628177FD257c2B1e500993e1a0baBcBd1',
    debtToken: '0x38e59ADE183BbEb94583d44213c8f3297e9933e9',
    decimals: 18,
    symbol: 'GHO'
  },
  wrsETH: {
    address: '0xEDfa23602D0EC14714057867A78d01e94176BEA0',
    aToken: '0x80a94C36747CF51b2FbabDfF045f6D22c1930eD1',
    debtToken: '0xe9541C77a111bCAa5dF56839bbC50894eba7aFcb',
    decimals: 18,
    symbol: 'wrsETH'
  },
  LBTC: {
    address: '0xecAc9C5F704e954931349Da37F60E39f515c11c1',
    aToken: '0x90072A4aA69B5Eb74984Ab823EFC5f91e90b3a72',
    debtToken: '0xa2525b3f058846075506903d792d58C5a0D834c9',
    decimals: 8,
    symbol: 'LBTC'
  },
  EURC: {
    address: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
    aToken: '0x90DA57E0A6C0d166Bf15764E03b83745Dc90025B',
    debtToken: '0x03D01595769333174036832e18fA2f17C74f8161',
    decimals: 6,
    symbol: 'EURC'
  },
  AAVE: {
    address: '0x63706e401c06ac8513145b7687A14804d17f814b',
    aToken: '0x67EAF2BeE4384a2f84Da9Eb8105C661C123736BA',
    debtToken: '0xcEC1Ea95dDEF7CFC27D3D9615E05b035af460978',
    decimals: 18,
    symbol: 'AAVE'
  },
  tBTC: {
    address: '0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b',
    aToken: '0xbcFFB4B3beADc989Bd1458740952aF6EC8fBE431',
    debtToken: '0x182cDEEC1D52ccad869d621bA422F449FA5809f5',
    decimals: 18,
    symbol: 'tBTC'
  }
};

// Legacy export for backwards compatibility
export const AAVE_TOKENS = AAVE_TOKENS_BSC;

// RPC Endpoints by chain
export const RPC_ENDPOINTS = {
  [CHAIN_IDS.BSC]: [
    'https://bsc-dataseed1.binance.org',
    'https://bsc-dataseed2.binance.org',
    'https://bsc-dataseed3.binance.org',
    'https://bsc-dataseed4.binance.org',
    'https://bsc.publicnode.com',
    'https://binance.llamarpc.com',
  ],
  [CHAIN_IDS.BASE]: [
    'https://mainnet.base.org',
    'https://base.publicnode.com',
    'https://base.llamarpc.com',
    'https://base-mainnet.public.blastapi.io',
  ],
};

// Chain configuration helper
export const CHAIN_CONFIG = {
  [CHAIN_IDS.BSC]: {
    name: 'BNB Chain',
    chainId: CHAIN_IDS.BSC,
    contracts: AAVE_CONTRACTS_BSC,
    tokens: AAVE_TOKENS_BSC,
    rpcEndpoints: RPC_ENDPOINTS[CHAIN_IDS.BSC],
    explorer: 'https://bscscan.com',
  },
  [CHAIN_IDS.BASE]: {
    name: 'Base',
    chainId: CHAIN_IDS.BASE,
    contracts: AAVE_CONTRACTS_BASE,
    tokens: AAVE_TOKENS_BASE,
    rpcEndpoints: RPC_ENDPOINTS[CHAIN_IDS.BASE],
    explorer: 'https://basescan.org',
  },
};

// Helper function to get chain config
export function getChainConfig(chainId: ChainId) {
  const config = CHAIN_CONFIG[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return config;
}

// Method signatures for Aave operations
export const AAVE_METHOD_SIGNATURES = {
  SUPPLY: '0x617ba037', // supply(address,uint256,address,uint16)
  WITHDRAW: '0x69328dec', // withdraw(address,uint256,address)
  BORROW: '0xa415bcad', // borrow(address,uint256,uint256,uint16,address)
  REPAY: '0x573ade81', // repay(address,uint256,uint256,address)
};
