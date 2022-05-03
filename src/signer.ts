import { ethers } from 'ethers'


export class Signer {
  readonly #privateKey?: Uint8Array

  private constructor(privKey?: Uint8Array) {
    this.#privateKey = privKey
  }

  static async fromETHSignature(ethSigner: ethers.Signer): Promise<Signer> {
    const signer = new Signer()
    return signer
  }

  static async fromL2Key(l2Key: string): Promise<Signer> {
    const signer = new Signer()
    return signer
  }
}
