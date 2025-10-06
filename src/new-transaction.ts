import { balanceCollection, txCollection } from './lib/db';
import { newFetchNewTransaction, Res } from './utils/fetch-new-transaction';
import { getCurrentRound, getTotalBalance } from './utils';

let lastTransaction: Res | null = null;
// const SOL_ADDRESS = 'So11111111111111111111111111111111111111111';

async function newTransaction() {
  try {
    let totalBalance = await getTotalBalance();

    // const transactions = await fetchNewTransaction();
    const inComingTransactions = await newFetchNewTransaction();

    // const inComingTransactions = transactions.filter(
    //   ({ flow, token_address }) =>
    //     flow === 'in' && token_address === SOL_ADDRESS
    // );

    if (inComingTransactions.length === 0) {
      console.log('No incoming SOL transfers found. \n');
      return;
    }

    const newestTx = inComingTransactions[0];

    if (
      lastTransaction &&
      newestTx?.time === lastTransaction?.time &&
      newestTx?.value === lastTransaction?.value
    ) {
      console.log('No new transactions. Skipping... \n');
      return;
    }

    const roundDoc = await getCurrentRound();

    if (!roundDoc) {
      console.log('There is no round doc in new-transaction fun\n');
      return;
    }

    for (const transaction of inComingTransactions) {
      const { from_address, value, time, trans_id, amount, token_decimals } =
        transaction;

      const isExist = await txCollection.findOne({ trans_id });

      if (!isExist) {
        // const solAmount = amount / Math.pow(10, token_decimals);

        console.log('New Incoming Transaction \n');
        console.log(`From: ${from_address}\n`);
        console.log(`Sol Amount: ${value} \n`); // ##

        // ##
        if (value < 0.03) {
          console.log('Balance less than 0.03 skipping');
          return;
        }

        await txCollection.insertOne({
          time,
          trans_id,
          from_address,
          sol: value, // ##
          token_decimals,
          value: value,
          round:
            roundDoc.status === 'active' ? roundDoc.round : roundDoc.round + 1,
        });

        totalBalance += Number(value);

        await balanceCollection.updateOne(
          // @ts-ignore
          { _id: 'wallet-balance' },
          { $set: { totalBalance } },
          { upsert: true }
        );

        console.log(`✅ Total balance updated: ${totalBalance} SOL\n`);
      }
    }

    lastTransaction = newestTx;
  } catch (error) {
    console.log('error in newTransaction function : \n');
    console.log(error, '\n');
  }
}

export default newTransaction;
