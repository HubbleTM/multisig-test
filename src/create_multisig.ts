//create_multisig_wallet.js
import { client } from './helpers/client';
import { getXChainFees } from './helpers/fees';
import { create_new_account } from './helpers/accounts';
import { BN, BinTools, avm, utils, Buffer } from 'avalanche';
import { ASSETS, MULTISIG, NETWORK_ID } from './resources/constants';
import { sleep } from './helpers/sleep';
import { getXChainBalance } from './helpers/balances';
import fs from 'fs';

const binTools = BinTools.getInstance();

async function main() {
  // Initialize chain components
  const chain = client.XChain();
  const keychain = chain.keyChain();
  const fee = new BN(getXChainFees().default);
  const locktime = new BN(0);
  const assetIdBuf = binTools.cb58Decode(ASSETS.AVAX);

  const outputs = [];
  const inputs: avm.TransferableInput[] = [];
  const memo = Buffer.from('Multisig address creation');

  // @ts-ignore
  // /  const blockchainID = utils.Defaults.network[NETWORK_ID].X.blockchainID;
  const blockchainID = '2eNy1mUFdmaxXNj1eQHUe7Np4gju9sJsEtWQ4MX3ToiNKuADed';
  console.log('blockchainID', blockchainID);

  const owner_1 = await create_new_account();
  const owner_2 = await create_new_account();
  const owner_3 = await create_new_account();

  const genesisPk = `PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN`;

  keychain.importKey(owner_1.privateKey);
  keychain.importKey(owner_2.privateKey);
  keychain.importKey(owner_3.privateKey);

  const mainAddresses = keychain.getAddresses();
  const mainAddressesString = keychain.getAddressStrings();

  const getBalanceResponse: any = await chain.getBalance(
    mainAddressesString[0],
    ASSETS.AVAX
  );

  const assetDetails = await chain.getAssetDescription(ASSETS.AVAX);

  let allBalances = await getXChainBalance(mainAddressesString[0]);

  if (!allBalances || allBalances.length == 0) {
    console.log('Address does not have any associated balances yet.');
    console.log(
      '=============================================================='
    );
    console.log(
      'Visit https://faucet.avax-test.network/ to pre-fund your address.'
    );
    console.log(
      '=============================================================='
    );
    console.log(`Wallet Address: ${mainAddressesString[0]}`);

    while (!allBalances || allBalances.length == 0) {
      allBalances = await getXChainBalance(mainAddressesString[0]);
      await sleep(2000);
    }
  }

  // @ts-ignore
  const assetBalances = allBalances.find((b) => b.asset == assetDetails.symbol);
  // @ts-ignore
  const balance = new BN(assetBalances.balance);

  const secpTransferOutput = new avm.SECPTransferOutput(
    balance.sub(fee),
    mainAddresses,
    locktime,
    MULTISIG.MIN_SIGNATURES
  );

  const transferableOutput = new avm.TransferableOutput(
    assetIdBuf,
    secpTransferOutput
  );
  outputs.push(transferableOutput);

  const avmUTXOResponse = await chain.getUTXOs(mainAddressesString);
  console.log('avmUTXOResponse', avmUTXOResponse);

  const utxoSet = avmUTXOResponse.utxos;
  console.log('utxoSet', utxoSet);

  const utxos = utxoSet.getAllUTXOs();
  console.log('utxos', utxos);

  utxos.forEach((utxo) => {
    const amountOutput = utxo.getOutput();
    // @ts-ignore
    const amt = amountOutput.getAmount().clone();
    const txid = utxo.getTxID();
    const outputidx = utxo.getOutputIdx();

    const secpTransferInput = new avm.SECPTransferInput(amt);

    secpTransferInput.addSignatureIdx(0, mainAddresses[0]);

    const input = new avm.TransferableInput(
      txid,
      outputidx,
      assetIdBuf,
      secpTransferInput
    );
    inputs.push(input);
  });

  //  const networkId = await client.Info().getNetworkID();

  const networkId = 12345;

  const baseTx = new avm.BaseTx(
    networkId,
    binTools.cb58Decode(blockchainID),
    outputs,
    inputs,
    memo
  );

  const account = {
    address: mainAddressesString[0],
    addressBytes: Buffer.from(mainAddresses[0]).toString('hex'),
    owner_1: owner_1,
    owner_2: owner_2,
    owner_3: owner_3,
  };

  const unsignedTx = new avm.UnsignedTx(baseTx);
  const tx = unsignedTx.sign(keychain);
  const txid = await chain.issueTx(tx);
  console.log(`Success! TXID: ${txid}`);
  console.log(`Account Data: ${JSON.stringify(account, null, 2)}`);

  const multiSigJson = JSON.stringify(account);

  fs.writeFile('account1.json', multiSigJson, function(err) {
    if (err) {
      console.error(err);
    } else {
      console.log('output.json has been saved with the user data');
    }
  });
}

main().catch((err) => {
  console.log('We have encountered an error!');
  console.error(err);
});
