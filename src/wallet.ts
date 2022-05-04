import { ethers } from 'ethers'
import { Transaction } from './operations'
import { Provider } from './provider'
import { Signer } from './signer'
import { Address, BalanceInfo, Order, SignedOrder } from './types'

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
    l2Key?: string
  ): Promise<Wallet> {
    if (l2Key == null) {
      // generate a new key
      l2Key = ''
    }

    const signer = await Signer.fromL2Key(l2Key)

    const wallet = new Wallet(provider, ethWallet, signer)

    return wallet
  }

  async bind(): Promise<Transaction> {
    let timestamp = Date.parse(new Date().toString())
    let address = await this._ethSigner.getAddress()
    let msg = `bind l1-l2 key, timestamp[${timestamp}] address1[${address}] address2[${address}]`
    const signature = await this._ethSigner.signMessage(msg)
    console.log('signature: ' + signature)
    // l2 sign

    // submit tx
    return new Transaction('', this.provider)
  }

  async deposit(token: string, amount: string, l1Key?: string): Promise<Transaction> {
    // if l1Key not null, only invoke l2 deposit method
    // if l1Key is null, invoke l1 and l2 deposit method
    return new Transaction('', this.provider)
  }

  async withdraw(token: string, amount: string, receiverL1Key?: string): Promise<Transaction> {
    return new Transaction('', this.provider)
  }

  async transfer(to: string, token: string, amount: string, fee: string): Promise<Transaction> {
    return new Transaction('', this.provider)
  }

  async queryTransaction(txHash: string): Promise<Transaction> {
    return new Transaction('', this.provider)
  }

  async queryBalance(token: string): Promise<BalanceInfo> {
    return new BalanceInfo()
  }

  async positionDeposit(positionId: number, token: string, amount: string): Promise<Transaction> {
    return new Transaction('', this.provider)
  }

  async positionWithdraw(positionId: number, token: string, amount: string): Promise<Transaction> {
    return new Transaction('', this.provider)
  }

  async signOrder(order: Order): Promise<SignedOrder> {
    const o2=new Order()
    return new SignedOrder()
  }
}
