import * as zknet from '../../src/zknet-web3.ts'
import { ethers } from 'ethers'

let zknetWallet

document.getElementById('connect').onclick = async () => {
  console.log('connect')
  const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
  await provider.send('eth_requestAccounts', [])
  const signer = provider.getSigner()
  let userAddress = await signer.getAddress()
  console.log(userAddress)

  let zknetProvider = zknet.newHttpProvider()
  zknetWallet = await zknet.Wallet.fromEthSigner(signer, zknetProvider)
  console.log(zknetWallet)
}

document.getElementById('bind').onclick = async () => {
  console.log('click')
  await zknetWallet.bind()
}
