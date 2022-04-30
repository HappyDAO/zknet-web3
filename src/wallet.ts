import { ethers } from 'ethers'
import { Provider } from './provider'
import { Signer } from './signer'
import { Address } from './types'

export class Wallet {
  protected constructor(
    public provider: Provider,
    public _ethSigner: ethers.Signer,
    public signer?: Signer,
    cachedAddress?: Address
  ) {}

  static async fromEthSigner(ethWallet: ethers.Signer, provider: Provider): Promise<Wallet> {
    const signer = await Signer.fromETHSignature(ethWallet)
    const wallet = new Wallet(provider, ethWallet, signer, await ethWallet.getAddress())
    return wallet
  }

  static async fromL2Key(
    ethWallet: ethers.Signer,
    provider: Provider,
    l2Key?: String
  ): Promise<Wallet> {
    if (l2Key == null) {
      // generate a new key
      l2Key = ''
    }

    const signer = await Signer.fromL2Key(l2Key)

    const wallet = new Wallet(provider, ethWallet, signer)

    return wallet
  }

  async bind() {
    let timestamp = Date.parse(new Date().toString())
    let address = await this._ethSigner.getAddress()
    let msg = `bind l1-l2 key, timestamp[${timestamp}] address1[${address}] address2[${address}]`
    const signature = await this._ethSigner.signMessage(msg)
    console.log('signature: ' + signature)
    // l2 sign

    // submit tx
  }
}
