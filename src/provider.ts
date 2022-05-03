import { AbstractJSONRPCTransport, HTTPTransport } from './transport '
import { ContractAddress, Network } from './types'
import { TokenSet } from './utils'

export class Provider {
  contractAddress: ContractAddress | undefined
  public tokenSet: TokenSet | undefined
  public pollIntervalMilliSecs = 1000
  public network?: Network
  public providerType: 'RPC' | 'Rest'

  constructor(public transport: AbstractJSONRPCTransport) {
    this.providerType = 'RPC'
  }
}

export async function newHttpProvider(
  address: string = 'http://127.0.0.1:8080',
  pollIntervalMilliSecs?: number,
  apiKey: string = 'test key',
  network?: Network
): Promise<Provider> {
  const transport = new HTTPTransport(address)
  const provider = new Provider(transport)
  if (pollIntervalMilliSecs) {
    provider.pollIntervalMilliSecs = pollIntervalMilliSecs
  }

  // todo: request contract addr and tokens
  provider.network = network
  return provider
}
