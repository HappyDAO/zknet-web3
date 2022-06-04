import { Bytes, ethers } from 'ethers'
import { Address, Order, SignedOrder } from './types'
import * as zksync from 'zksync-web3'
import { perpetualABI } from './abi/Perpetual.abi'
import { entropyToMnemonic } from '@ethersproject/hdnode'

export class Wallet {
  protected constructor(
    private _l1Address: string,
    private _zksyncWallet: zksync.Wallet,
    public perpetual: zksync.Contract,
    public ethWallet: ethers.Signer
  ) {}

  static async fromEthSigner(
    ethWallet: ethers.Signer,
    perpetual: zksync.Contract,
    zksyncUrl: string,
    provider: ethers.providers.Provider
  ): Promise<Wallet> {
    const l1Address = await ethWallet.getAddress()
    const sign = await ethWallet.signMessage('Sign this message to access zknet: ' + l1Address)
    const mnemonic = entropyToMnemonic(ethers.utils.sha256(sign))
    const l2Key = ethers.Wallet.fromMnemonic(mnemonic).privateKey
    console.log(l2Key)
    const zksyncWallet = new zksync.Wallet(l2Key)
      .connect(new zksync.Provider(zksyncUrl))
      .connectToL1(provider)
    return new Wallet(l1Address, zksyncWallet, perpetual, ethWallet)
  }

  static async fromZksyncWallet(
    zksyncWallet: zksync.Wallet,
    perpetual: zksync.Contract
  ): Promise<Wallet> {
    perpetual.connect(zksyncWallet)
    const wallet = new Wallet(
      zksyncWallet.address,
      zksyncWallet,
      perpetual,
      zksyncWallet._signerL1()
    )
    return wallet
  }

  async signMessage(message: Bytes | string): Promise<string> {
    return await this._zksyncWallet.signMessage(message)
  }

  private async signTx(tx: zksync.types.TransactionRequest): Promise<string> {
    let tx2 = await this._zksyncWallet.populateTransaction(tx)
    return await this._zksyncWallet.signTransaction(tx2)
  }

  getZksyncWallet(): zksync.Wallet {
    return this._zksyncWallet
  }

  getL1Address(): string {
    return this._l1Address
  }

  async signBindTx(): Promise<string> {
    let timestamp = Date.parse(new Date().toString())
    let address = await this._zksyncWallet.getAddress()
    let msg = `bind l1-l2 key, timestamp[${timestamp}] address1[${address}] address2[${address}]`
    const signature = await this._zksyncWallet.signMessage(msg)
    console.log('signature: ' + signature)
    // l2 sign
    return ''
  }

  async signDepositTx(token: number, amount: string): Promise<string> {
    const tx = await this.perpetual.populateTransaction.deposit(token, amount)
    return await this.signTx(tx)
  }

  async signWithdrawTx(token: number, amount: string): Promise<string> {
    const tx = await this.perpetual.populateTransaction.withdraw(token, amount)
    return await this.signTx(tx)
  }

  async signTransferTx(to: string, token: number, amount: string, fee: string): Promise<string> {
    const tx = await this.perpetual.populateTransaction.transfer(to, token, amount, fee)
    return await this.signTx(tx)
  }

  async signPositionDepositTx(positionId: string, token: number, amount: string): Promise<string> {
    const tx = await this.perpetual.populateTransaction.positionDeposit(positionId, token, amount)
    return await this.signTx(tx)
  }

  async signPositionWithdrawTx(positionId: string, token: number, amount: string): Promise<string> {
    const tx = await this.perpetual.populateTransaction.positionWithdraw(positionId, token, amount)
    return await this.signTx(tx)
  }

  async signOrder(contractAddress: string, order: Order): Promise<SignedOrder> {
    const domain = {
      name: 'ZKnet Perpetual',
      version: '1',
      chainId: 0,
      verifyingContract: contractAddress,
    }

    let signedOrder: SignedOrder = {
      trader: this._zksyncWallet.address,
      timestamp: Math.floor(Date.now() / 1000),
      signature: '',
      id: order.id,
      type: order.type,
      positionId: order.positionId,
      positionToken: order.positionToken,
      positionAmount: order.positionAmount,
      fee: order.fee,
      extend: order.extend,
    }

    const message = {
      id: signedOrder.id,
      typ: signedOrder.type,
      trader: signedOrder.trader,
      positionId: signedOrder.positionId,
      positionToken: signedOrder.positionToken,
      positionAmount: signedOrder.positionAmount,
      fee: signedOrder.fee,
      extend: signedOrder.extend,
      timestamp: signedOrder.timestamp,
    }
    signedOrder.signature = await this._zksyncWallet._signTypedData(domain, orderTypes, message)
    return signedOrder
  }

  async balanceOf(token: number): Promise<number> {
    return await this.perpetual
      .connect(this._zksyncWallet)
      .balanceOf(this._zksyncWallet.getAddress(), token)
  }
}

export function loadPerpetualContract(contractAddress: string): zksync.Contract {
  return new zksync.Contract(contractAddress, perpetualABI)
}

const orderTypes = {
  Order: [
    { name: 'id', type: 'uint256' },
    { name: 'typ', type: 'string' },
    { name: 'trader', type: 'address' },
    { name: 'positionId', type: 'uint64' },
    { name: 'positionToken', type: 'uint32' },
    { name: 'positionAmount', type: 'int256' },
    { name: 'fee', type: 'uint256' },
    { name: 'extend', type: 'string' },
    { name: 'timestamp', type: 'uint32' },
  ],
}
