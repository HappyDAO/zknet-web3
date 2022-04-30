import { Tokens } from './types'

export class TokenSet {
  private tokensBySymbol: Tokens 

  constructor(tokensBySymbol: Tokens) {
    this.tokensBySymbol = tokensBySymbol
  }
}
