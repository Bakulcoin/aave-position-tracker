// Aave V3 BSC Contract Addresses
export const AAVE_CONTRACTS = {
  POOL: '0x6807dc923806fE8Fd134338EABCA509979a7e0cB',
  POOL_DATA_PROVIDER: '0x41393e5e337606dc3821075Af65AeE84D7688CBD',
  ORACLE: '0x39bc1bCEa2bD4Aa074d52A1fF52eBa510E1c4D8a',
};

// Aave V3 BSC token addresses
// Source: https://github.com/bgd-labs/aave-address-book
export const AAVE_TOKENS = {
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

// Method signatures for Aave operations
export const AAVE_METHOD_SIGNATURES = {
  SUPPLY: '0x617ba037', // supply(address,uint256,address,uint16)
  WITHDRAW: '0x69328dec', // withdraw(address,uint256,address)
  BORROW: '0xa415bcad', // borrow(address,uint256,uint256,uint16,address)
  REPAY: '0x573ade81', // repay(address,uint256,uint256,address)
};
