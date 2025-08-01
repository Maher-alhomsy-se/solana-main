import type { Document, WithId } from 'mongodb';

import { roundCollection } from './lib/db';

interface Props {
  endDate: Date;
  roundDoc: WithId<Document>;
}

const startNewRound = async ({ roundDoc, endDate }: Props) => {
  const newRoundNumber = roundDoc.round + 1;
  const newEndDate = new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  await roundCollection.updateOne(
    // @ts-ignore
    { _id: 'round-collection' },
    {
      $set: {
        status: 'active',
        round: newRoundNumber,
        endDate: newEndDate.toISOString(),
        startDate: new Date().toISOString(),
      },
    }
  );

  console.log(
    `✅ Round increased to ${newRoundNumber}. New end date: ${newEndDate.toISOString()} \n`
  );
};

export default startNewRound;
