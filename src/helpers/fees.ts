// fees.js
import { AVMAPI } from "avalanche/dist/apis/avm"
import { client } from "./client"
import { GetXChainFees } from "./interfaces"

// Initialize the X-Chain client and keychain
const xChain: AVMAPI = client.XChain()

export function getXChainFees(): GetXChainFees {
  return {
    creation: xChain.getCreationTxFee().toString(),
    tx: xChain.getTxFee().toString(),
    default: xChain.getDefaultTxFee().toString()
  }
}
