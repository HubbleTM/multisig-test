import { AVMAPI } from "avalanche/dist/apis/avm"
import { client } from "./client"

export async function getXChainBalance(address: string): Promise<object[] | undefined> {
  const xChain: AVMAPI = client.XChain()
  const balances: object[] = await xChain.getAllBalances(address)
  console.log(balances)

  if (balances.length > 0) {
    return balances
  } else {
    return undefined
  }
}
