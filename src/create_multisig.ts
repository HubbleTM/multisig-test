//create_multisig_wallet.js
import { client } from "./helpers/client"
import { getXChainFees } from "./helpers/fees"
import { create_new_account } from "./helpers/accounts"
import { BN, BinTools, Buffer } from "avalanche"
import { ASSETS, BLOCKCHAIN_ID, MULTISIG, NETWORK_ID } from "./resources/constants"
import { sleep } from "./helpers/sleep"
import { getXChainBalance } from "./helpers/balances"
import fs from "fs"
import { AmountOutput, AVMAPI, BaseTx, KeyChain, KeyPair, SECPTransferInput, SECPTransferOutput, TransferableInput, TransferableOutput, Tx, UnsignedTx, UTXO, UTXOSet } from "avalanche/dist/apis/avm"
import { Account, NewAccount, UTXOResponse } from "./helpers/interfaces"

export interface AssetDetails {
  name: string
  symbol: string
  assetID: Buffer
  denomination: number
}

const binTools: BinTools = BinTools.getInstance()

const main = async (): Promise<any> => {
  // Initialize chain components
  const chain: AVMAPI = client.XChain()
  const keychain: KeyChain = chain.keyChain()
  const fee: BN = new BN(getXChainFees().default)
  const locktime: BN = new BN(0)
  const threshold: number = MULTISIG.MIN_SIGNATURES
  const assetIdBuf: Buffer = binTools.cb58Decode(ASSETS.AVAX)

  const outputs: TransferableOutput[] = []
  const inputs: TransferableInput[] = []
  const memo: Buffer = Buffer.from("Multisig address creation")

  const genesisPk: string = "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"

  keychain.importKey(genesisPk)
  const address: Buffer = keychain.getAddresses()[0]
  const addressStr: string = keychain.getAddressStrings()[0]
  const keyPair: KeyPair = keychain.getKey(address)

  const whale: NewAccount = {
    publicKey: keyPair.getPublicKeyString(),
    privateKey: keyPair.getPrivateKeyString(),
    address: addressStr

  }
  const owner_1: NewAccount = await create_new_account()
  const owner_2: NewAccount = await create_new_account()

  const mainAddresses: Buffer[] = keychain.getAddresses()
  const mainAddressesString: string[] = keychain.getAddressStrings()

  // const getBalanceResponse: object = await chain.getBalance(
  //   mainAddressesString[0],
  //   ASSETS.AVAX
  // )

  const assetDetails = await chain.getAssetDescription(ASSETS.AVAX) as AssetDetails
  let allBalances: any = await getXChainBalance(mainAddressesString[0])

  if (!allBalances || allBalances.length == 0) {
    console.log("Address does not have any associated balances yet.")
    console.log("==============================================================")
    console.log("Visit https://faucet.avax-test.network/ to pre-fund your address.")
    console.log("==============================================================")
    console.log(`Wallet Address: ${mainAddressesString[0]}`)

    while (!allBalances || allBalances.length == 0) {
      allBalances = await getXChainBalance(mainAddressesString[0])
      await sleep(2000)
    }
  }

  const assetBalances: any = allBalances.find((b: any) => b.asset == assetDetails.symbol)
  const balance: BN = new BN(assetBalances["balance"])

  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    balance.sub(fee),
    mainAddresses,
    locktime,
    threshold
  )

  const transferableOutput: TransferableOutput = new TransferableOutput(
    assetIdBuf,
    secpTransferOutput
  )
  outputs.push(transferableOutput)
  outputs.sort()

  const utxoResponse: UTXOResponse = await chain.getUTXOs(mainAddressesString)
  const utxoSet: UTXOSet = utxoResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()

  utxos.forEach((utxo: UTXO): void => {
    const amountOutput = utxo.getOutput() as AmountOutput
    const amt = amountOutput.getAmount().clone()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()
    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
    secpTransferInput.addSignatureIdx(0, mainAddresses[0])

    const input: TransferableInput = new TransferableInput(
      txid,
      outputidx,
      assetIdBuf,
      secpTransferInput
    )
    inputs.push(input)
  })

  const baseTx: BaseTx = new BaseTx(
    NETWORK_ID,
    binTools.cb58Decode(BLOCKCHAIN_ID),
    outputs,
    inputs,
    memo
  )

  const account: Account = {
    address: mainAddressesString[0],
    addressBytes: Buffer.from(mainAddresses[0]).toString("hex"),
    owner_1: whale,
    owner_2: owner_1,
    owner_3: owner_2
  }

  const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)
  const tx: Tx = unsignedTx.sign(keychain)
  const txid: string = await chain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
  console.log(`Account Data: ${JSON.stringify(account, null, 2)}`)

  const multiSigJson: string = JSON.stringify(account)

  fs.writeFile("src/account1.json", multiSigJson, (err: any) => {
    if (err) {
      console.error(err)
    } else {
      console.log("account1.json has been saved with the user data")
    }
  })
}

main().catch((err: any) => {
  console.log("We have encountered an error!")
  console.error(err)
})
