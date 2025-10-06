import dotenv from 'dotenv';
import axios from 'axios';

import { HELIUSRes } from '../types';

dotenv.config();

const API_KEY = process.env.HELIUS_API_KEY!;
const SOLANA_ADDRESS = process.env.WALLET_ADDRESS!;
const SOLANA_API_KEY = process.env.SOLANA_API_KEY!;

export interface Res {
  time: string;
  value: number;
  amount: number;
  trans_id: string;
  flow: 'in' | 'out';
  from_address: string;
  token_decimals: number;
}

const fetchNewTransaction = async () => {
  const URL = 'https://pro-api.solscan.io/v2.0/account/transfer';

  const now = Math.floor(Date.now() / 1000);
  const SEVEN_DAYS_AGO = now - 7 * 24 * 60 * 60;

  const { data } = await axios.get(URL, {
    params: {
      page: 1,
      flow: 'in',
      page_size: 100,
      sort_order: 'desc',
      to: SOLANA_ADDRESS,
      sort_by: 'block_time',
      address: SOLANA_ADDRESS,
      exclude_amount_zero: true,
      from_time: SEVEN_DAYS_AGO,
    },
    headers: { token: SOLANA_API_KEY },
  });

  console.log(data);

  const transactions: Res[] = data?.data || [];

  return transactions;
};

export default fetchNewTransaction;

export async function newFetchNewTransaction(): Promise<Res[]> {
  const now = Math.floor(Date.now() / 1000);
  const SEVEN_DAYS_AGO = now - 7 * 24 * 60 * 60;

  const url = `https://api.helius.xyz/v0/addresses/${SOLANA_ADDRESS}/transactions`;

  let allTxs: HELIUSRes[] = [];
  let beforeSig: string | undefined = undefined;

  while (true) {
    const params: Record<string, string | number> = {
      limit: 100,
      'api-key': API_KEY,
      ...(beforeSig ? { before: beforeSig } : {}),
    };

    const { data } = await axios.get<HELIUSRes[]>(url, { params });

    if (!Array.isArray(data) || data.length === 0) break;

    allTxs.push(...data);

    const last = data[data.length - 1];
    if (last.timestamp < SEVEN_DAYS_AGO) break;

    beforeSig = last.signature;
  }

  const result = allTxs
    .filter((tx) => tx.timestamp >= SEVEN_DAYS_AGO)
    .flatMap(({ timestamp, nativeTransfers, signature }) => {
      if (!nativeTransfers) return [];

      return nativeTransfers
        .filter(({ toUserAccount }) => toUserAccount === SOLANA_ADDRESS)
        .map(({ amount, fromUserAccount }) => ({
          amount: 0,
          token_decimals: 9,
          trans_id: signature,
          token_amount: amount,
          flow: 'in' as 'in' | 'out',
          from_address: fromUserAccount,
          time: new Date(timestamp * 1000).toISOString(),
          value: parseFloat((amount / 1e9).toFixed(9)), // SOL value
        }));
    });

  return result;
}
