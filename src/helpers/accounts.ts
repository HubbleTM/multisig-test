//create_account.js
// Load and configure Avalanche client
import { AVMAPI, KeyChain, KeyPair } from "avalanche/dist/apis/avm"
import { client } from "./client"
import { NewAccount, KeyPairJSON } from "./interfaces"

export async function create_new_account(): Promise<NewAccount> {
  // Initialize the X-Chain client and keychain
  const chain: AVMAPI = client.XChain()
  const keyChain: KeyChain = chain.keyChain();

  // Create new keypair
  console.log("Generating a new keypair...")
  /**
   * keyChain.makeKey() generates a new private key. You can have as many private keys as you like, for different purposes, like staking or token transfers.
   */
  const keyPair: KeyPair = keyChain.makeKey()

  const keyPairJson: KeyPairJSON = {
    pubkey: keyPair.getPublicKeyString(),
    privkey: keyPair.getPrivateKeyString(),
  }

  /**
   * keyChain.importKey(...) loads an existing private key. Could be loaded from an environment variable or a file (in our case).
   */
  const key: KeyPair = keyChain.importKey(keyPairJson.privkey)
  console.log(`Imported X-chain address: ${key.getAddressString()}`)
  return {
    publicKey: keyPairJson.pubkey,
    privateKey: keyPairJson.privkey,
    address: key.getAddressString()
  }
}
