import bs58 from 'bs58';
import dotenv from 'dotenv';
import { createJupiterApiClient } from '@jup-ag/api';
import { clusterApiUrl, Connection, Keypair } from '@solana/web3.js';

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY_BASE58!;

const payer = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));

const connection = new Connection(clusterApiUrl('mainnet-beta'), {
  commitment: 'confirmed',
});

const jupiter = createJupiterApiClient({
  basePath: 'https://lite-api.jup.ag/swap/v1',
});

export { jupiter, connection, payer };
