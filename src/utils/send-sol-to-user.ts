import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

import { connection, payer } from '../config/jupiter';

const senderWallet = payer;

async function sendSolToUser(toAddress: string, amount: number) {
  const recipient = new PublicKey(toAddress);
  const lamports = Math.floor(amount * LAMPORTS_PER_SOL); // Convert to lamports

  if (lamports <= 0) {
    console.warn(`⚠️ Skipping ${toAddress} — amount too small: ${amount} SOL`);
    return null;
  }

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: senderWallet.publicKey,
      toPubkey: recipient,
      lamports,
    })
  );

  const signature = await sendAndConfirmTransaction(connection, transaction, [
    senderWallet,
  ]);

  console.log(`✅ Send ${amount} Sol to ${toAddress} \n`);

  return signature;
}

export default sendSolToUser;
