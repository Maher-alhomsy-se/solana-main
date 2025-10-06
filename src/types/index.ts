export interface Token {
  fdv: number;
  mcap: number;
  name: string;
  symbol: string;
  usdPrice: number;
  decimals: number;
  isVerified: boolean;
}

export interface HELIUSRes {
  description: string;
  type: string;
  source: string;
  fee: number;
  feePayer: string;
  signature: string;
  slot: number;
  timestamp: number;
  tokenTransfers: any[];
  accountData: AccountDatum[];
  nativeTransfers: NativeTransfer[];
}

interface AccountDatum {
  account: string;
  nativeBalanceChange: number;
  tokenBalanceChanges: any[];
}

interface NativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number;
}
