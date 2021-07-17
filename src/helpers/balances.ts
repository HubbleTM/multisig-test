import { client } from './client';

export async function getXChainBalance(address: string) {
  const xChain = client.XChain();

  const balances = await xChain.getAllBalances(address);

  if (balances.length > 0) {
    return balances;
  } else {
    return undefined;
  }
}
