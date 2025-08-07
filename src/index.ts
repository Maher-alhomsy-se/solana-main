import cron from 'node-cron';

import reset from './reset';
import { roundCollection } from './lib/db';
import startNewRound from './start-new-round';
import newTransaction from './new-transaction';
import { getCurrentRound, formatRemainingTime } from './utils';
import scheduleSellHalfToken from './schedule-sell-half-token';

import './bots/main-bot'; // force execute bot file
import './bots/assists-bot';

let isResetting = false;

async function checkRoundEnd() {
  if (isResetting) {
    console.log('⏳ Reset already in progress, skipping...');
    return;
  }

  const roundDoc = await getCurrentRound();

  if (!roundDoc) {
    console.log('There is no round in checkRoundEnd fun \n');
    return;
  }

  formatRemainingTime(roundDoc.endDate);

  const now = new Date();
  const endDate = new Date(roundDoc.endDate);

  if (now >= endDate) {
    isResetting = true;

    try {
      await roundCollection.updateOne(
        // @ts-ignore
        { _id: 'round-collection' },
        { $set: { status: 'finished' } }
      );

      await reset();

      await startNewRound({ endDate, roundDoc });
    } catch (err) {
      console.error('❌ Error during reset:', err);
    } finally {
      isResetting = false;
    }
  }
}

const main = async () => {
  console.log('🚀 Bots initialized. Cron jobs starting...');

  // Check every minute if round has ended
  cron.schedule('* * * * *', async () => {
    await checkRoundEnd();
  });

  // Run transaction checker every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    console.log('Running new transaction every 5 minutes \n');
    newTransaction();
  });

  cron.schedule('0 * * * *', () => {
    console.log('Running schedule sell half amount of token \n');
    scheduleSellHalfToken();
  });
};

main().catch((err) => {
  console.log('error in main function\n');
  console.log(err, '\n');
});
