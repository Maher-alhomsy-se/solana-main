import {
  txCollection,
  tokensCollection,
  balanceCollection,
  balanceHistoryCollection,
} from './lib/db';
import { delay, getCurrentRound, sendSolToUser, swapTokenToSol } from './utils';

const reset = async () => {
  try {
    // const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

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
      const sign = await swapTokenToSol(mint);

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

    const userTxs = await txCollection
      .find({ round: roundDoc.round })
      .toArray();

    const totalUserSentIn7Days = userTxs.reduce(
      (sum, tx) => sum + Number(tx.value),
      0
    );

    if (totalUserSentIn7Days === 0) {
      console.log('⚠️ No user transactions this round. Skipping payouts.');
      return;
    }

    // 5. Calculate 80% to distribute
    const keepAmount = prevTotalBalance * 0.2;
    const distributable = prevTotalBalance * 0.8;

    // 6. Group by user and calculate percentage shares
    const userMap: any = {};

    for (const tx of userTxs) {
      const from = tx.from_address;
      userMap[from] = (userMap[from] ?? 0) + Number(tx.value);
    }

    for (const [user, amount] of Object.entries(userMap)) {
      const percentage = (amount as number) / totalUserSentIn7Days;
      const userShare = percentage * distributable;

      await sendSolToUser(user, userShare);
      await delay(6000);
    }

    // 7. Reset Total Balance to 0
    await balanceCollection.updateOne(
      // @ts-ignore
      { _id: 'wallet-balance' },
      { $set: { totalBalance: 0 } },
      { upsert: true }
    );

    // 8. Save balance history
    await balanceHistoryCollection.insertOne({
      keepAmount,
      distributable,
      prevTotalBalance,
      soldAt: new Date(),
      round: roundDoc.round,
      userBreakdown: userMap,
      totalUserSent: totalUserSentIn7Days,
    });

    console.log('✅ All tokens sold, users paid, and balance reset. \n');
  } catch (error) {
    console.log('❌ error in reset function: ', error, '\n');
  }
};

export default reset;
