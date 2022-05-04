export type Network = 'localhost' | 'rinkeby' | 'mainnet'

const MAINNET_NETWORK_CHAIN_ID = 1
const RINKEBY_NETWORK_CHAIN_ID = 4
const LOCALHOST_NETWORK_CHAIN_ID = 9

export function l1ChainId(network?: Network): number {
  if (network === 'rinkeby') {
    return RINKEBY_NETWORK_CHAIN_ID
  }
  if (network === 'mainnet') {
    return MAINNET_NETWORK_CHAIN_ID
  }
  if (network === 'localhost') {
    return LOCALHOST_NETWORK_CHAIN_ID
  }
  throw new Error('Unsupported netwrok')
}

export interface ContractAddress {
  mainContract: string
  govContract: string
}

export interface Tokens {
  [token: string]: {
    address: string
    id: number
    symbol: string
    decimals: number
  }
}

// 0x-prefixed, hex encoded, ethereum account address
export type Address = string

export interface TransactionReceipt {
  executed: boolean
  success?: boolean
  failReason?: string
}

export class L2TransactionReceipt {
  executed: boolean = false
  success?: boolean
  failReason?: string

  public L2TransactionReceipt() {}
}

export class BalanceInfo {
  balance: number = 0
  decimal: number = 0

  public BalanceInfo() {}
}

export class Order {
  positionId: number = 0
  tokenBuy: string = ''
  tokenSell: string = ''
  amountBuy: string = ''
  amountSell: string = ''
  orderType: string = ''
  fee: string = ''
  extend: string = ''

  public Order() {}
}

export class SignedOrder extends Order {
  timestamp: number = 0
  signature: string = ''
  public SignedOrder() {}
}
