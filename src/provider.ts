import Axios from 'axios'

export class Provider {
  constructor(
    public address: string = 'http://localhost:8088',
    public pollIntervalMilliSecs: number = 1000,
    public apiKey: string = '333'
  ) {}

  async sendTransaction(method: string, param = {}): Promise<string> {
    let txHash = await this.request(method, param)
    return txHash
  }

  private async request(method: string, param: any): Promise<any> {
    const request = {
      id: 1,
      jsonrpc: '2.0',
      method: method,
      params: [param],
    }

    const response = await Axios.post(this.address + '/zknet', request, {
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    }).then((resp: { data: any }) => {
      return resp.data
    })

    if ('result' in response) {
      return response.result
    } else if ('error' in response) {
      console.log(response.error)
      throw new Error(response.error.message)
    } else {
      throw new Error('Unknown Error')
    }
  }
}
