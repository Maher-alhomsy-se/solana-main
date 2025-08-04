// import {
//   PublicKey,
//   Transaction,
//   SystemProgram,
//   LAMPORTS_PER_SOL,
//   sendAndConfirmTransaction,
// } from '@solana/web3.js';

// import { connection, payer } from '../config/jupiter';

// const senderWallet = payer;

// async function sendSolToUser(toAddress: string, amount: number) {
//   const recipient = new PublicKey(toAddress);
//   const lamports = Math.floor(amount * LAMPORTS_PER_SOL); // Convert to lamports

//   if (lamports <= 0) {
//     console.warn(`⚠️ Skipping ${toAddress} — amount too small: ${amount} SOL`);
//     return null;
//   }

//   const transaction = new Transaction().add(
//     SystemProgram.transfer({
//       fromPubkey: senderWallet.publicKey,
//       toPubkey: recipient,
//       lamports,
//     })
//   );

//   const signature = await sendAndConfirmTransaction(connection, transaction, [
//     senderWallet,
//   ]);

//   console.log(`✅ Send ${amount} Sol to ${toAddress} \n`);

//   return signature;
// }

// export default sendSolToUser;

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
  try {
    // Validate address
    let recipient: PublicKey;

    try {
      recipient = new PublicKey(toAddress);
    } catch {
      console.warn(`⚠️ Invalid Solana address: ${toAddress}`);
      return null;
    }

    // Convert SOL to lamports
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

    // Skip very small sends
    if (lamports <= 0) {
      console.warn(
        `⚠️ Skipping ${toAddress} — amount too small: ${amount} SOL`
      );
      return null;
    }

    // Check wallet balance before sending
    const walletBalance = await connection.getBalance(senderWallet.publicKey);

    // Leave a small buffer for transaction fees (~5000 lamports ≈ 0.000005 SOL)
    const feeBuffer = 5000;

    if (walletBalance < lamports + feeBuffer) {
      console.warn(
        `⚠️ Skipping ${toAddress} — not enough SOL. Have ${(
          walletBalance / LAMPORTS_PER_SOL
        ).toFixed(6)} SOL, need ${(lamports / LAMPORTS_PER_SOL).toFixed(6)} SOL`
      );
      return null;
    }

    // Create transfer transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderWallet.publicKey,
        toPubkey: recipient,
        lamports,
      })
    );

    // Send and confirm
    const signature = await sendAndConfirmTransaction(connection, transaction, [
      senderWallet,
    ]);

    console.log(`✅ Sent ${amount} SOL to ${toAddress}`);
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
