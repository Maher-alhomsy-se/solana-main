import bs58 from 'bs58';
import { PublicKey } from '@solana/web3.js';

function isValidAddress(str: string) {
  try {
    const decoded = bs58.decode(str);
    if (decoded.length < 32 || decoded.length > 44) return false;

    new PublicKey(str);

    const suffixes = ['bonk', 'pump'];
    if (suffixes.some((suf) => str.endsWith(suf))) {
      return true;
    }

    return true;
  } catch (err) {
    return false;
  }
}

export default isValidAddress;
