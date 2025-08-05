import { jupiter } from '../config/jupiter';

/**
 * Get token price in SOL
 * @param mint token mint address
 * @param decimals token decimals
 * @returns price in SOL (1 token = ? SOL)
 */

export async function getTokenPriceInSol(mint: string, decimals: number) {
  try {
    // Amount = 1 token in smallest unit
    const oneTokenInSmallestUnit = Math.pow(10, decimals);

    const quote = await jupiter.quoteGet({
      inputMint: mint,
      outputMint: 'So11111111111111111111111111111111111111112',
      amount: oneTokenInSmallestUnit,
      slippageBps: 50,
    });

    if (!quote?.outAmount) {
      throw new Error(`No quote found for token ${mint}`);
    }

    const solAmount = Number(quote.outAmount) / 1e9;
    return solAmount;
  } catch (error) {
    console.error(`❌ Failed to get token price in SOL for ${mint}:`, error);
    return null;
  }
}
