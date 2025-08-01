import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';

import { payer, connection } from '../config/jupiter';

async function getTokenBalance(token: string) {
  const ata = await getAssociatedTokenAddress(
    new PublicKey(token),
    payer.publicKey
  );

  try {
    const account = await getAccount(connection, ata);
    return account.amount;
  } catch (e) {
    console.log(`⚠️ No associated token account found for ${token} \n`);
    return 0n;
  }
}

export default getTokenBalance;
