import Axios from 'axios'

class Subscription {
  constructor(public unsubscribe: () => Promise<void>) {}
}

export abstract class AbstractJSONRPCTransport {
  abstract request(method: string, params: any): Promise<any>
  subscriptionsSupported(): boolean {
    return false
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async subscribe(
    subMethod: string,
    subParams: any,
    unsubMethod: string,
    cb: (data: any) => void
  ): Promise<Subscription> {
    throw new Error('subscription are not supported for this transport')
  }
  abstract disconnect(): void
}

export class HTTPTransport extends AbstractJSONRPCTransport {
  public constructor(public address: string) {
    super()
  }

  // JSON RPC request
  async request(method: string, params = null, config?: any): Promise<any> {
    const request = {
      id: 1,
      jsonrpc: '2.0',
      method,
      params,
    }

    const response = await Axios.post(this.address, request, config).then((resp: { data: any }) => {
      return resp.data
    })

    if ('result' in response) {
      return response.result
    } else if ('error' in response) {
      throw new Error(response.error)
    } else {
      throw new Error('Unknown Error')
    }
  }

  async disconnect() {}
}
