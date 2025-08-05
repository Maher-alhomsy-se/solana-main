import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

import { connection, payer } from '../config/jupiter';

const senderWallet = payer;

async function sendSolToUser(toAddress: string, amountSOL: number) {
  try {
    let recipient: PublicKey;

    try {
      recipient = new PublicKey(toAddress);
    } catch {
      console.warn(`⚠️ Invalid Solana address: ${toAddress}`);
      return null;
    }

    const lamports = Math.floor(amountSOL * LAMPORTS_PER_SOL);

    if (lamports <= 0) {
      console.warn(
        `⚠️ Skipping ${toAddress} — amount too small: ${amountSOL.toFixed(
          8
        )} SOL`
      );
      return null;
    }

    const feeBuffer = 5000;
    const walletBalance = await connection.getBalance(senderWallet.publicKey);

    if (walletBalance < lamports + feeBuffer) {
      console.warn(
        `⚠️ Skipping ${toAddress} — not enough SOL. Have ${(
          walletBalance / LAMPORTS_PER_SOL
        ).toFixed(6)} SOL, need ${amountSOL.toFixed(6)} SOL`
      );
      return null;
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        lamports,
        toPubkey: recipient,
        fromPubkey: senderWallet.publicKey,
      })
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [
      senderWallet,
    ]);

    console.log(`✅ Sent ${amountSOL.toFixed(6)} SOL to ${toAddress}`);
    return signature;
  } catch (err: any) {
    console.error(
      `❌ Failed to send SOL to ${toAddress}:`,
      err?.message || err
    );
    return null;
  }
}

export default sendSolToUser;
