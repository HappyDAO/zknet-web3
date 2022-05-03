import { Provider } from './provider'
import { L2TransactionReceipt, TransactionReceipt } from './types'

export class Transaction {
  state: 'SUCCESS' | 'FAIL' | 'PEDDING' | 'NO_DATA'
  error?: Error

  constructor(public txHash: string, public provider: Provider) {
    this.state = 'SUCCESS'
  }

  async awaitReceipt(): Promise<TransactionReceipt> {
    this.throwErrorIfFailedState()

    return new L2TransactionReceipt()
  }

  private throwErrorIfFailedState() {
    if (this.state === 'FAIL') throw this.error
  }
}
