//constants.js
// Avalanche Assets
import { utils } from "avalanche"
import { Assets, Multisig } from "../helpers/interfaces"
export const NETWORK_ID = 12345
export const BLOCKCHAIN_ID: string = utils.Defaults.network[NETWORK_ID].X.blockchainID
const avaxAssetID: string = utils.Defaults.network[NETWORK_ID].X.avaxAssetID
export const ASSETS: Assets = {
  AVAX: avaxAssetID
}

// Multisig Accounts
export const MULTISIG: Multisig = {
  MIN_SIGNATURES: 2
}

