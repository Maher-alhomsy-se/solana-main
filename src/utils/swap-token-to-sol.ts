import {
  VersionedTransaction,
  sendAndConfirmRawTransaction,
} from '@solana/web3.js';

import getTokenBalance from './get-token-balance';
import { connection, jupiter, payer } from '../config/jupiter';

interface Props {
  token: string;
  decimals?: number;
  amountInTokens?: number;
}

const swapTokenToSol = async ({ token, amountInTokens, decimals }: Props) => {
  try {
    const balance = await getTokenBalance(token);

    if (balance === 0n) {
      console.log(`❌ No ${token} tokens to swap. \n`);
      return null;
    }

    let amountToSell = balance;
    if (amountInTokens && decimals !== undefined) {
      amountToSell = BigInt(
        Math.floor(amountInTokens * Math.pow(10, decimals))
      );
    }

    // console.log(
    //   `🔁 Swapping ${
    //     Number(amountToSell) / Math.pow(10, decimals)
    //   } ${token} to SOL`
    // );

    const quoteResponse = await jupiter.quoteGet({
      slippageBps: 100,
      inputMint: token,
      // @ts-ignore
      amount: amountToSell.toString(),
      outputMint: 'So11111111111111111111111111111111111111112',
    });

    if (!quoteResponse || !quoteResponse.outAmount) {
      console.log('❌ No swap route found. \n');
      return null;
    }

    const userPublicKey = payer.publicKey.toBase58();

    const swapRes = await jupiter.swapPost({
      swapRequest: { quoteResponse, userPublicKey, wrapAndUnwrapSol: true },
    });

    if (!swapRes.swapTransaction) {
      console.log('❌ Swap transaction not returned from Jupiter API \n');
      return null;
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
  } catch (err: any) {
    console.error(`❌ Swap failed for ${token}:`, err?.message || err);
    return null; // Don’t throw, just skip this token
  }
};

export default swapTokenToSol;
