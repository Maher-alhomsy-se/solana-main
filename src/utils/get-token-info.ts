import { Token } from '../types';

const getTokenInfo = async (token: string) => {
  const resp = await fetch(
    `https://lite-api.jup.ag/tokens/v2/search?query=${token}`
  );

  const data = await resp.json();

  return data[0] as Token;
};

export default getTokenInfo;
