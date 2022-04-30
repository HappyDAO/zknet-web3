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
    mainContract: string;
    govContract: string;
}

export interface Tokens {
    [token: string]: {
        address: string;
        id: number;
        symbol: string;
        decimals: number;
    };
}

// 0x-prefixed, hex encoded, ethereum account address
export type Address = string;

