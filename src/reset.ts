import {
  txCollection,
  tokensCollection,
  balanceCollection,
  balanceHistoryCollection,
} from './lib/db';
import { delay, getCurrentRound, sendSolToUser, swapTokenToSol } from './utils';

const reset = async () => {
  try {
    const roundDoc = await getCurrentRound();

    if (!roundDoc) {
      console.log('❌ There is no round in reset fun \n');
      return;
    }

    const tokens = await tokensCollection
      .find({ round: roundDoc.round })
      .toArray();

    for (const token of tokens) {
      const { mint } = token;
      const sign = await swapTokenToSol({ token: mint });

      if (sign) {
        console.log(`✅ Sold ${mint}, tx: ${sign}`);
      }

      console.log('\n\n');
      await delay(10000);
    }

    const balanceDoc = await balanceCollection.findOne({
      // @ts-ignore
      _id: 'wallet-balance',
    });

    const prevTotalBalance = balanceDoc?.totalBalance || 0;

    if (prevTotalBalance <= 0) {
      console.warn('⚠️ No funds to distribute.');
      return;
    }

    const userTxs = await txCollection
      .find({ round: roundDoc.round })
      .toArray();

    const keepAmount = prevTotalBalance * 0.2;
    const distributable = prevTotalBalance * 0.8;

    const userMap: any = {};

    for (const tx of userTxs) {
      const from = tx.from_address;
      userMap[from] = (userMap[from] ?? 0) + Number(tx.sol);
    }

    for (const [user, amount] of Object.entries(userMap)) {
      const percentage = (amount as number) / prevTotalBalance;
      const userShare = percentage * distributable;

      await sendSolToUser(user, userShare);
      await delay(6000);
    }

    await balanceCollection.updateOne(
      // @ts-ignore
      { _id: 'wallet-balance' },
      { $set: { totalBalance: 0 } },
      { upsert: true }
    );

    await balanceHistoryCollection.insertOne({
      keepAmount,
      distributable,
      prevTotalBalance,
      soldAt: new Date(),
      round: roundDoc.round,
      userBreakdown: userMap,
    });

    console.log('✅ All tokens sold, users paid, and balance reset. \n');
  } catch (error) {
    console.log('❌ error in reset function: ', error, '\n');
  }
};

export default reset;
