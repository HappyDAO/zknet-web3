export interface ContractAddress {
  l2MainContract: string
  l1GovContract: string
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

export class Order {
  id: string = ''
  type: string = ''
  positionId: string = '0'
  positionToken: number = 0
  positionAmount: string = '1'
  fee: string = '0.1'
  extend: string = '{}'
}

export class SignedOrder extends Order {
  trader: string = ''
  timestamp: number = 0
  signature: string = ''
}
