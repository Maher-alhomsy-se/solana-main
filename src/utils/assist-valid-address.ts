import bs58 from 'bs58';
import { PublicKey } from '@solana/web3.js';

function assistsValidAddress(address: string) {
  try {
    const decoded = bs58.decode(address);
    if (decoded.length < 32 || decoded.length > 44) return false;

    new PublicKey(address);

    return true;
  } catch (err) {
    return false;
  }
}

export default assistsValidAddress;
