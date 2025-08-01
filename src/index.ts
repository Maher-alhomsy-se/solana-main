import cron from 'node-cron';

import reset from './reset';
import { getCurrentRound } from './utils';
import { roundCollection } from './lib/db';
import { mainBot, assistsBot } from './bots';
import newTransaction from './new-transaction';
import startNewRound from './start-new-round';

async function checkRoundEnd() {
  const roundDoc = await getCurrentRound();

  if (!roundDoc) {
    console.log('There is no round in checkRoundEnd fun \n');
    return;
  }

  const now = new Date();
  const endDate = new Date(roundDoc.endDate);

  if (now >= endDate) {
    await roundCollection.updateOne(
      // @ts-ignore
      { _id: 'round-collection' },
      { $set: { status: 'finished' } }
    );

    await reset();

    await startNewRound({ endDate, roundDoc });
  }
}

const main = async () => {
  // Check every minute if round has ended
  cron.schedule('* * * * *', async () => {
    await checkRoundEnd();
  });

  // Run transaction checker every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    console.log('Running new transaction every 5 minutes \n');
    newTransaction();
  });
};

main().catch((err) => {
  console.log('error in main function\n');
  console.log(err, '\n');
});
