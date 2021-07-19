import { client } from "./helpers/client"
import { utils, BinTools, BN, Buffer } from "avalanche"
import { MULTISIG, NETWORK_ID } from "./resources/constants"
import { AmountOutput, AVMAPI, BaseTx, KeyChain, SECPTransferInput, SECPTransferOutput, TransferableInput, TransferableOutput, Tx, UnsignedTx, UTXO, UTXOSet } from "avalanche/dist/apis/avm"
import { UTXOResponse } from "./helpers/interfaces"

const multisig1: any = require("./account1.json")
const SENDER: any = multisig1
const xChain: AVMAPI = client.XChain()
const bintools: BinTools = BinTools.getInstance()
const xKeychain: KeyChain = xChain.keyChain()

xKeychain.importKey(SENDER.owner_1.privateKey)
xKeychain.importKey(SENDER.owner_3.privateKey)
xKeychain.importKey(SENDER.owner_2.privateKey)

const mainAddresses: Buffer[] = xChain.keyChain().getAddresses()
const mainAddressStrings: string[] = xChain.keyChain().getAddressStrings()
const blockchainID: string = utils.Defaults.network[NETWORK_ID].X.blockchainID
const avaxAssetID: string = utils.Defaults.network[NETWORK_ID].X.avaxAssetID
const avaxAssetIDBuf: Buffer = bintools.cb58Decode(avaxAssetID)
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = xChain.getDefaultTxFee()
const locktime: BN = new BN(0)
const threshold: number = 1
const memo: Buffer = Buffer.from("AVM Transfer from multisig output")

const main = async (): Promise<any> => {
  const utxoResponse: UTXOResponse = await xChain.getUTXOs(mainAddressStrings)
  const utxoSet: UTXOSet = utxoResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  const amountOutput = utxos[0].getOutput() as AmountOutput
  const balance: string = amountOutput.getAmount().toString()

  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    new BN(balance).sub(fee),
    [mainAddresses[0]],
    locktime,
    threshold
  )

  const transferableOutput: TransferableOutput = new TransferableOutput(
    avaxAssetIDBuf,
    secpTransferOutput
  )
  outputs.push(transferableOutput)

  mainAddresses.sort()
  utxos.forEach((utxo: UTXO): void => {
    const amountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount().clone()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()
    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
    mainAddresses.forEach((address: Buffer, index: number): void => {
      if (index < MULTISIG.MIN_SIGNATURES) {
        secpTransferInput.addSignatureIdx(index, address)
      }
    })

    const transferableInput: TransferableInput = new TransferableInput(
      txid,
      outputidx,
      avaxAssetIDBuf,
      secpTransferInput
    )
    inputs.push(transferableInput)
  })

  const baseTx: BaseTx = new BaseTx(
    NETWORK_ID,
    bintools.cb58Decode(blockchainID),
    outputs,
    inputs,
    memo
  )

  const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)
  const tx: Tx = unsignedTx.sign(xKeychain)
  const txid: string = await xChain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
