import axios from 'axios';

const AAVE_GRAPHQL_ENDPOINT = 'https://api.v3.aave.com/graphql';

export interface AaveUserPosition {
  chainId: number;
  chainName: string;
  supplied: AaveAssetPosition[];
  borrowed: AaveAssetPosition[];
  totalSuppliedUSD: number;
  totalBorrowedUSD: number;
  netWorthUSD: number;
  healthFactor: number;
}

export interface AaveAssetPosition {
  symbol: string;
  underlyingAsset: string;
  aTokenAddress: string;
  balance: number;
  balanceUSD: number;
  supplyAPY?: number;
  borrowAPY?: number;
}

export class AaveApiService {
  /**
   * Get supported chains from Aave API
   */
  async getSupportedChains(): Promise<{ chainId: number; name: string }[]> {
    const query = `
      query Chains {
        chains {
          name
          chainId
        }
      }
    `;

    try {
      const response = await axios.post(AAVE_GRAPHQL_ENDPOINT, { query });
      return response.data.data?.chains || [];
    } catch (error) {
      console.error('Error fetching Aave chains:', error);
      return [];
    }
  }

  /**
   * Get user positions from Aave GraphQL API
   * This queries the user's current supplied and borrowed positions
   */
  async getUserPositions(walletAddress: string, chainId: number = 56): Promise<AaveUserPosition | null> {
    // Query for user account data across markets
    const query = `
      query UserPositions($user: String!, $chainId: Int!) {
        userPositions(user: $user, chainId: $chainId) {
          supplies {
            asset {
              symbol
              underlyingAsset
              aToken
              decimals
            }
            balance
            balanceUSD
            supplyAPY
          }
          borrows {
            asset {
              symbol
              underlyingAsset
              variableDebtToken
              decimals
            }
            balance
            balanceUSD
            borrowAPY
          }
          totalSuppliedUSD
          totalBorrowedUSD
          netWorthUSD
          healthFactor
        }
      }
    `;

    try {
      const response = await axios.post(AAVE_GRAPHQL_ENDPOINT, {
        query,
        variables: {
          user: walletAddress.toLowerCase(),
          chainId,
        },
      });

      if (response.data.errors) {
        console.error('GraphQL errors:', response.data.errors);
        return null;
      }

      const data = response.data.data?.userPositions;
      if (!data) return null;

      return {
        chainId,
        chainName: 'BNB Chain',
        supplied: data.supplies?.map((s: any) => ({
          symbol: s.asset.symbol,
          underlyingAsset: s.asset.underlyingAsset,
          aTokenAddress: s.asset.aToken,
          balance: parseFloat(s.balance),
          balanceUSD: parseFloat(s.balanceUSD),
          supplyAPY: parseFloat(s.supplyAPY),
        })) || [],
        borrowed: data.borrows?.map((b: any) => ({
          symbol: b.asset.symbol,
          underlyingAsset: b.asset.underlyingAsset,
          aTokenAddress: b.asset.variableDebtToken,
          balance: parseFloat(b.balance),
          balanceUSD: parseFloat(b.balanceUSD),
          borrowAPY: parseFloat(b.borrowAPY),
        })) || [],
        totalSuppliedUSD: parseFloat(data.totalSuppliedUSD) || 0,
        totalBorrowedUSD: parseFloat(data.totalBorrowedUSD) || 0,
        netWorthUSD: parseFloat(data.netWorthUSD) || 0,
        healthFactor: parseFloat(data.healthFactor) || 0,
      };
    } catch (error) {
      console.error('Error fetching user positions from Aave API:', error);
      return null;
    }
  }

  /**
   * Get user activities (transactions) from Aave
   */
  async getUserActivities(walletAddress: string, chainId: number = 56): Promise<any[]> {
    const query = `
      query UserActivities($user: String!, $chainId: Int!) {
        userActivities(user: $user, chainId: $chainId, first: 100) {
          items {
            timestamp
            txHash
            type
            asset {
              symbol
              decimals
            }
            amount
            amountUSD
          }
        }
      }
    `;

    try {
      const response = await axios.post(AAVE_GRAPHQL_ENDPOINT, {
        query,
        variables: {
          user: walletAddress.toLowerCase(),
          chainId,
        },
      });

      if (response.data.errors) {
        console.error('GraphQL errors:', response.data.errors);
        return [];
      }

      return response.data.data?.userActivities?.items || [];
    } catch (error) {
      console.error('Error fetching user activities from Aave API:', error);
      return [];
    }
  }
}
