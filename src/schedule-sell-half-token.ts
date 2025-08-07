import {
  delay,
  swapTokenToSol,
  getCurrentRound,
  getTokenPriceInSol,
} from './utils';
import { tokensCollection } from './lib/db';

async function scheduleSellHalfToken() {
  try {
    const roundDoc = await getCurrentRound();

    if (!roundDoc) {
      console.warn('⚠️ No active round found.');
      return;
    }

    const tokens = await tokensCollection
      .find({ round: roundDoc.round, soldHalf: { $exists: false } })
      .toArray();

    for (const token of tokens) {
      const { mint, tokenPriceInSol, tokenAmount, decimals } = token;

      if (!tokenPriceInSol || !tokenAmount) {
        console.warn(`⚠️ Missing price or amount for token ${mint}`);
        continue;
      }

      const currentPriceInSol = await getTokenPriceInSol(mint, decimals);

      if (!currentPriceInSol) {
        console.warn(`⚠️ Could not fetch price for ${mint}`);
        continue;
      }

      console.info(
        `📊 ${mint} | Bought: ${tokenPriceInSol} SOL | Now: ${currentPriceInSol} SOL \n`
      );

      if (currentPriceInSol < tokenPriceInSol * 2) {
        console.info(`📉 Price has not doubled for ${mint}, skipping. \n`);
        continue;
      }

      await delay(3000);

      console.log('Amount Token Now | ', tokenAmount, '\n');

      const halfAmount = tokenAmount / 2;

      console.log('half Amount | ', halfAmount, '\n');

      const txSig = await swapTokenToSol({
        decimals,
        token: mint,
        amountInTokens: halfAmount,
      });

      if (txSig) {
        console.log(`✅ Sold 50% of ${mint}, tx: ${txSig}`);

        await tokensCollection.updateOne(
          { mint, round: roundDoc.round },
          { $set: { soldHalf: true } }
        );
      } else {
        console.warn(`⚠️ Failed to sell ${mint}`);
      }

      await delay(5000);
    }
  } catch (error) {
    console.error(`❌ Error in scheduleSellHalfToken:`, error);
  }
}

export default scheduleSellHalfToken;
