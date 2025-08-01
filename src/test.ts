import { roundCollection, tokensCollection, txCollection } from './lib/db';

async function createOrUpdateRoundCollection() {
  const now = new Date();

  // Add 2 days, 23 hours, 30 minutes
  const endDate = new Date(
    now.getTime() +
      2 * 24 * 60 * 60 * 1000 + // 2 days
      23 * 60 * 60 * 1000 + // 23 hours
      30 * 60 * 1000 // 30 minutes
  );

  const roundDoc = {
    _id: 'round-collection', // Static ID
    startDate: now.toISOString(), // Human-readable ISO format
    endDate: endDate.toISOString(),
    round: 1, // You can update this later when round increases
  };

  await roundCollection.updateOne(
    {
      // @ts-ignore
      _id: 'round-collection',
    },
    { $set: roundDoc },
    { upsert: true }
  );

  console.log('✅ Round collection created/updated:', roundDoc);
}

// createOrUpdateRoundCollection();

async function updateOldTokens() {
  const result = await tokensCollection.updateMany(
    { round: { $exists: false } }, // Only tokens without round field
    { $set: { round: 1 } }
  );

  console.log(`✅ Updated ${result.modifiedCount} tokens to round 1`);
}

// updateOldTokens();

async function updateOldTX() {
  const result = await txCollection.updateMany(
    { round: { $exists: false } }, // Only tokens without round field
    { $set: { round: 1 } }
  );

  console.log(`✅ Updated ${result.modifiedCount} tokens to round 1`);
}

// updateOldTX();

async function addStatusProp() {
  const result = await roundCollection.updateOne(
    // @ts-ignore
    { _id: 'round-collection' },
    { $set: { status: 'active' } }
  );

  console.log(result);
}

addStatusProp();
