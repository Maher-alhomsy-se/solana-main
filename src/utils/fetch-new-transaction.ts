import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const SOLANA_ADDRESS = process.env.WALLET_ADDRESS!;
const SOLANA_API_KEY = process.env.SOLANA_API_KEY!;

export interface Res {
  time: string;
  value: number;
  amount: number;
  trans_id: string;
  flow: 'in' | 'out';
  from_address: string;
  token_address: string;
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

  const transactions: Res[] = data?.data || [];

  return transactions;
};

export default fetchNewTransaction;
