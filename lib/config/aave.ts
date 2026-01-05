// Aave V3 BSC Contract Addresses
export const AAVE_CONTRACTS = {
  POOL: '0x6807dc923806fE8Fd134338EABCA509979a7e0cB',
  POOL_DATA_PROVIDER: '0x41393e5e337606dc3821075Af65AeE84D7688CBD',
  ORACLE: '0x39bc1bCEa2bD4Aa074d52A1fF52eBa510E1c4D8a',
  // Add more if needed
};

// Common Aave tokens on BSC
export const AAVE_TOKENS = {
  USDT: {
    address: '0x55d398326f99059fF775485246999027B3197955',
    aToken: '0x6ab707Aca953eDAeFBc4fD23bA73294241490620',
    decimals: 18,
    symbol: 'USDT'
  },
  USDC: {
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    aToken: '0x00901a076785e0906d1028c7d6372d247bec7d61',
    decimals: 18,
    symbol: 'USDC'
  },
  WBNB: {
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    aToken: '0x00901a076785e0906d1028c7d6372d247bec7d61',
    decimals: 18,
    symbol: 'WBNB'
  },
  BTCB: {
    address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    aToken: '0x00901a076785e0906d1028c7d6372d247bec7d61',
    decimals: 18,
    symbol: 'BTCB'
  },
  ETH: {
    address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    aToken: '0x00901a076785e0906d1028c7d6372d247bec7d61',
    decimals: 18,
    symbol: 'ETH'
  }
};

// Method signatures for Aave operations
export const AAVE_METHOD_SIGNATURES = {
  SUPPLY: '0x617ba037', // supply(address,uint256,address,uint16)
  WITHDRAW: '0x69328dec', // withdraw(address,uint256,address)
  BORROW: '0xa415bcad', // borrow(address,uint256,uint256,uint16,address)
  REPAY: '0x573ade81', // repay(address,uint256,uint256,address)
};
