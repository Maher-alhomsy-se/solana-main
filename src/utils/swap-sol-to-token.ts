import {
  VersionedTransaction,
  sendAndConfirmRawTransaction,
} from '@solana/web3.js';

import { jupiter, payer, connection } from '../config/jupiter';

type Props = {
  token: string;
  decimals: number;
  buyDouble?: boolean;
};

async function swapSolToToken({ token, decimals, buyDouble }: Props) {
  const solAmount = buyDouble ? 0.3 : 0.15;
  const lamports = Math.floor(solAmount * 1e9);

  const balance = await connection.getBalance(payer.publicKey);

  if (balance < lamports) {
    console.info(`⚠️ Balance is less than ${solAmount} SOL \n`);
    return;
  }

  const quoteResponse = await jupiter.quoteGet({
    inputMint: 'So11111111111111111111111111111111111111112',
    outputMint: token,
    slippageBps: 100,
    amount: lamports,
    // restrictIntermediateTokens:t
  });

  if (!quoteResponse || !quoteResponse.outAmount) {
    throw new Error('❌ No swap route found');
  }

  const tokenAmount = Number(quoteResponse.outAmount) / Math.pow(10, decimals);
  const tokenPriceInSol = solAmount / tokenAmount;

  const userPublicKey = payer.publicKey.toBase58();

  const swapResponse = await jupiter.swapPost({
    swapRequest: { quoteResponse, userPublicKey, wrapAndUnwrapSol: true },
  });

  if (!swapResponse.swapTransaction) {
    throw new Error('❌ Swap transaction not returned from Jupiter API');
  }

  const serializedTx = Buffer.from(swapResponse.swapTransaction, 'base64');
  const tx = VersionedTransaction.deserialize(serializedTx);
  tx.sign([payer]);

  const signature = await sendAndConfirmRawTransaction(
    connection,
    Buffer.from(tx.serialize())
  );

  return { signature, tokenPriceInSol, tokenAmount };
}

export default swapSolToToken;
