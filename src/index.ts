import cron from 'node-cron';

import reset from './reset';
import { roundCollection } from './lib/db';
import newTransaction from './new-transaction';
import startNewRound from './start-new-round';
import { formatRemainingTime, getCurrentRound } from './utils';

import './bots/main-bot'; // force execute bot file
// import './bots/assists-bot';

async function checkRoundEnd() {
  const roundDoc = await getCurrentRound();

  if (!roundDoc) {
    console.log('There is no round in checkRoundEnd fun \n');
    return;
  }

  formatRemainingTime(roundDoc.endDate);

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
};

main().catch((err) => {
  console.log('error in main function\n');
  console.log(err, '\n');
});
