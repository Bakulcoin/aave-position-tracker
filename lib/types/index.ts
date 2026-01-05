export interface AaveTransaction {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  methodId: string;
  functionName: string;
  input: string;
}

export interface TokenPosition {
  symbol: string;
  address: string;
  amount: number;
  initialPrice: number;
  currentPrice: number;
  initialValue: number;
  currentValue: number;
}

export interface AavePosition {
  supplied: TokenPosition[];
  borrowed: TokenPosition[];
  initialNetWorth: number;
  currentNetWorth: number;
  totalPnL: number;
  pnlPercentage: number;
}

export interface PnLCard {
  walletAddress: string;
  position: AavePosition;
  timestamp: number;
}

export interface TokenPrice {
  symbol: string;
  address: string;
  price: number;
  timestamp?: number;
}

export interface AaveEvent {
  type: 'supply' | 'withdraw' | 'borrow' | 'repay';
  token: string;
  amount: number;
  timestamp: number;
  txHash: string;
  blockNumber: number;
}
