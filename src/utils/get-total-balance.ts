import { balanceCollection } from '../lib/db';

const getTotalBalance = async () => {
  const balanceDoc = await balanceCollection.findOne({
    // @ts-ignore
    _id: 'wallet-balance',
  });

  const totalBalance: number = balanceDoc?.totalBalance ?? 0;

  return totalBalance;
};

export default getTotalBalance;
