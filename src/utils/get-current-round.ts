import { roundCollection } from '../lib/db';

const getCurrentRound = async () => {
  const doc = await roundCollection.findOne({
    // @ts-ignore
    _id: 'round-collection',
  });

  if (!doc) {
    console.log('❌ Round Collection not found \n');
    return;
  }

  return doc;
};

export default getCurrentRound;
