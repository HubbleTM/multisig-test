import { client } from './helpers/client';
import { avm, utils, BinTools, BN, Buffer } from 'avalanche';

import { MULTISIG_ACCOUNT_1, MULTISIG_ACCOUNT_2 } from './resources/accounts';

import { getXChainBalance } from './helpers/balances';

import { NETWORK_ID } from './resources/constants';

const multisig1 = require('./account1.json');
//const SENDER = MULTISIG_ACCOUNT_1;
const SENDER = multisig1;
const RECEIVER = MULTISIG_ACCOUNT_2;

const xchain = client.XChain();
const bintools = BinTools.getInstance();
const xKeychain = xchain.keyChain();

xKeychain.importKey(SENDER.owner_1.privateKey);
xKeychain.importKey(SENDER.owner_2.privateKey);
xKeychain.importKey(SENDER.owner_3.privateKey);

const mainAddresses = xchain.keyChain().getAddresses();
const mainAddressStrings = xchain.keyChain().getAddressStrings();

// blockchain id was incorrect for me at least

// @ts-ignore
// const blockchainID = utils.Defaults.network[NETWORK_ID].X.blockchainID;
const blockchainID = '2eNy1mUFdmaxXNj1eQHUe7Np4gju9sJsEtWQ4MX3ToiNKuADed';
// @ts-ignore
const avaxAssetID = utils.Defaults.network[NETWORK_ID].X.avaxAssetID;
const avaxAssetIDBuf = bintools.cb58Decode(avaxAssetID);
const outputs: avm.TransferableOutput[] = [];
const inputs: avm.TransferableInput[] = [];
const fee = xchain.getDefaultTxFee();
const locktime = new BN(0);
const memo = Buffer.from('AVM Transfer from multisig account');

const main = async function() {
  console.log(`Transfer from ${SENDER.address} to ${RECEIVER.address}
  Sender Balance:   ${await getXChainBalance(SENDER.address)}
  Receiver Balance: ${await getXChainBalance(RECEIVER.address)}`);

  console.log('mainAddressStrings', mainAddressStrings);

  const { balance }: any = await xchain.getBalance(SENDER.address, 'AVAX');
  console.log('balance', balance);

  // const getBalanceResponse = await xchain.getBalance(
  //   mainAddressStrings[0],
  //   avaxAssetID
  // );

  // @ts-ignore
  // const balance = new BN(getBalanceResponse['balance']);
  const secpTransferOutput = new avm.SECPTransferOutput(
    new BN(balance).sub(fee),
    [mainAddresses[0]],
    locktime,
    1
  ); //threshold = 1

  const transferableOutput = new avm.TransferableOutput(
    avaxAssetIDBuf,
    secpTransferOutput
  );
  outputs.push(transferableOutput);

  const avmUTXOResponse = await xchain.getUTXOs(mainAddressStrings);

  const utxoSet = avmUTXOResponse.utxos;
  const utxos = utxoSet.getAllUTXOs();
  utxos.forEach((utxo) => {
    const amountOutput = utxo.getOutput();
    console.log('each output', amountOutput);

    // @ts-ignore
    const amt = amountOutput.getAmount().clone();
    const txid = utxo.getTxID();
    const outputidx = utxo.getOutputIdx();

    const secpTransferInput = new avm.SECPTransferInput(amt);

    mainAddresses.forEach((address, index) => {
      if (index < 3) {
        secpTransferInput.addSignatureIdx(index, address);
      }
    });

    const input = new avm.TransferableInput(
      txid,
      outputidx,
      avaxAssetIDBuf,
      secpTransferInput
    );
    inputs.push(input);
  });

  //  const networkId = await client.Info().getNetworkID();
  const networkId = 12345;

  const baseTx = new avm.BaseTx(
    networkId,
    bintools.cb58Decode(blockchainID),
    outputs,
    inputs,
    memo
  );

  console.log('outputs', outputs);

  const unsignedTx = new avm.UnsignedTx(baseTx);
  console.log('test', await unsignedTx.getOutputTotal(avaxAssetIDBuf));

  const tx = unsignedTx.sign(xKeychain);

  console.log('tx', tx);

  const txid = await xchain.issueTx(tx);
  console.log(`Success! TXID: ${txid}`);
  console.log(`Sender Balance:   ${await getXChainBalance(SENDER.address)}
  Receiver Balance: ${await getXChainBalance(RECEIVER.address)}`);
};

main();
