import getTokenBalance from './get-token-balance';
import { connection, jupiter, payer } from '../config/jupiter';
import {
  sendAndConfirmRawTransaction,
  VersionedTransaction,
} from '@solana/web3.js';

const swapTokenToSol = async (token: string) => {
  const balance = await getTokenBalance(token);

  if (balance === 0n) {
    console.log(`❌ No ${token} tokens to swap. \n`);
    return;
  }

  console.log(`🔁 Swapping ${Number(balance) / 1e6} ${token} to SOL \n`);

  const quoteResponse = await jupiter.quoteGet({
    slippageBps: 100,
    inputMint: token,
    // amount: Number(balance),
    // @ts-ignore
    amount: balance.toString(),
    outputMint: 'So11111111111111111111111111111111111111112',
  });

  if (!quoteResponse || !quoteResponse.outAmount) {
    console.log('❌ No swap route found. \n');
    return;
  }

  const userPublicKey = payer.publicKey.toBase58();

  const swapRes = await jupiter.swapPost({
    swapRequest: { quoteResponse, userPublicKey, wrapAndUnwrapSol: true },
  });

  if (!swapRes.swapTransaction) {
    throw new Error('❌ Swap transaction not returned from Jupiter API \n');
  }

  const serializedTx = Buffer.from(swapRes.swapTransaction, 'base64');
  const tx = VersionedTransaction.deserialize(serializedTx);
  tx.sign([payer]);

  const sig = await sendAndConfirmRawTransaction(
    connection,
    Buffer.from(tx.serialize())
  );

  console.log(`✅ Sold ${token} for SOL. Tx: ${sig} \n`);

  return sig;
};

export default swapTokenToSol;
