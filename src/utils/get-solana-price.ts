async function getSolanaPrice() {
  const resp = await fetch(
    'https://lite-api.jup.ag/price/v3?ids=So11111111111111111111111111111111111111112'
  );

  const json = await resp.json();
  const solData = json['So11111111111111111111111111111111111111112'];

  const data = solData?.usdPrice ? parseFloat(solData.usdPrice) : null;

  return data;
}

export default getSolanaPrice;
