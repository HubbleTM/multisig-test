// fees.js
import { client } from './client';

// Initialize the X-Chain client and keychain
const xChain = client.XChain();

export function getXChainFees() {
  return {
    'creation': xChain.getCreationTxFee().toString(),
    'tx': xChain.getTxFee().toString(),
    'default': xChain.getDefaultTxFee().toString(),
  };
}
