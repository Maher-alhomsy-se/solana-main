import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

async function isExecutable(address: string) {
  try {
    const publicKey = new PublicKey(address);
    const accountInfo = await connection.getAccountInfo(publicKey);

    if (!accountInfo) return { valid: false };

    return {
      valid: true,
      executable: accountInfo.executable,
    };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

export default isExecutable;
