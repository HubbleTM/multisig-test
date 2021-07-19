import { UTXOSet } from "avalanche/dist/apis/avm"

export interface KeyPairJSON {
  pubkey: string
  privkey: string
}

export interface NewAccount {
  publicKey: string
  privateKey: string
  address: string
}

export interface AssetDetails {
  name: string
  symbol: string
  assetID: Buffer
  denomination: number
}

export interface GetXChainFees {
  creation: string
  tx: string
  default: string
}

export interface Assets {
  AVAX: string
}

export interface Multisig {
  MIN_SIGNATURES: number
}

export interface Account {
  address: string
  addressBytes: string
  owner_1: NewAccount
  owner_2: NewAccount
  owner_3: any
}

export interface EndIndex {
  address: string
  utxo: string

}

export interface UTXOResponse {
  numFetched: number
  utxos: UTXOSet
  endIndex: EndIndex
}

export interface Account {
  address: string
  addressBytes: string
  owner_1: NewAccount
  owner_2: NewAccount
  owner_3: any
}