import * as zknet from '../../src/zknet-web3'
import * as zksync from 'zksync-web3'
import { erc20ABI } from './erc20.abi'
import { ethers } from 'ethers'

const contractAddress = '0x930833004d88b8bF3208a216323aFfdf9D40C14C'
const ethUrl = 'http://121.89.245.161:8545'
const zksyncUrl = 'http://121.89.245.161:3050'
const zknetUrl = 'http://localhost:8088'
const ERC20_ADDRESS = '0x3fad2b2e21ea1c96618cc76a42fb5a77c3f71c6f'
const ERC20_ID = 1

const pks = [
  '0x9890a78d684c13a7ce31eb8edc9ba062928a66f9bf4c3e40d1acab2dc32e52d5',
  '0x8fa6d869bc0453c179b0004518f9043306ef3c43ecadd2387297df5c6a1963a9',
]

const ethProvider = ethers.getDefaultProvider(ethUrl)
const zksyncProvider = new zksync.Provider(zksyncUrl)
const zknetProvider = new zknet.Provider(zknetUrl)
const perpetual = zknet.loadPerpetualContract(contractAddress)
const erc20L2 = new zksync.Contract(ERC20_ADDRESS, erc20ABI, zksyncProvider)

let zksyncWallets: zksync.Wallet[] = [undefined, undefined]
let zknetWallets: zknet.Wallet[] = [undefined, undefined]

let orders: zknet.SignedOrder[] = [undefined, undefined]

async function sendTransactionAndUpdateBalance(index: number, method: string, param = {}) {
  let txHash = await zknetProvider.sendTransaction(method, param)
  console.log('tx hash: ', txHash)
  const res = await zksyncProvider.getTransactionReceipt(txHash)
  console.log('tx res: ', res)
  await updateBalance(index)
}

async function sendTransaction(method: string, param = {}) {
  let txHash = await zknetProvider.sendTransaction(method, param)
  console.log('tx hash: ', txHash)
  const res = await zksyncProvider.getTransactionReceipt(txHash)
}

async function updateBalance(index: number) {
  console.log('update balance')
  let balance = await perpetual
    .connect(zksyncWallets[index])
    .balanceOf(zksyncWallets[index].address, ERC20_ID)
  document.getElementById('balance' + index).innerText = balance.toString()
}

async function connect(index: number) {
  // const provider = new ethers.providers.Web3Provider(window.ethereum)
  // await provider.send('eth_requestAccounts', [])
  // const signer = provider.getSigner()
  // const zknetWallet = await zknet.Wallet.fromEthSigner(signer, perpetual, zksyncUrl, provider)

  const zknetWallet = await zknet.Wallet.fromZksyncWallet(
    new zksync.Wallet(pks[index], zksyncProvider, ethProvider),
    perpetual
  )
  zksyncWallets[index] = zknetWallet.getZksyncWallet()
  zknetWallets[index] = zknetWallet
  console.log(zknetWallets[index].getZksyncWallet().address)
  await updateBalance(index)
}

async function deposit(index: number) {
  await (await erc20L2.connect(zksyncWallets[index]).approve(perpetual.address, 100)).wait()
  let signedTx = await zknetWallets[index].signDepositTx(ERC20_ID, '100')
  await sendTransactionAndUpdateBalance(index, 'zkn_deposit', {
    address: zksyncWallets[index].address,
    timestamp: 100,
    sign: signedTx,
    token: ERC20_ID,
    amount: '100',
  })
}

async function withdraw(index: number) {
  let signedTx = await zknetWallets[index].signWithdrawTx(ERC20_ID, '100')
  await sendTransactionAndUpdateBalance(index, 'zkn_withdraw', {
    address: zksyncWallets[index].address,
    timestamp: 100,
    sign: signedTx,
    token: ERC20_ID,
    amount: '100',
  })
}

async function positionDeposit(index: number) {
  const positionId = (index + 1).toString()
  let signedTx = await zknetWallets[index].signPositionDepositTx(positionId, ERC20_ID, '100')
  await sendTransactionAndUpdateBalance(index, 'zkn_positionDeposit', {
    address: zksyncWallets[index].address,
    timestamp: 100,
    sign: signedTx,
    positionId: positionId,
    token: ERC20_ID,
    amount: '100',
  })
}

async function positionWithdraw(index: number) {
  const positionId = (index + 1).toString()
  let signedTx = await zknetWallets[index].signPositionWithdrawTx(positionId, ERC20_ID, '100')
  await sendTransactionAndUpdateBalance(index, 'zkn_positionWithdraw', {
    address: zksyncWallets[index].address,
    timestamp: 100,
    sign: signedTx,
    positionId: positionId,
    token: ERC20_ID,
    amount: '100',
  })
}

async function signOrder(index: number) {
  const positionId = (index + 1).toString()
  const orderId = String(Math.floor(Date.now() / 1000)) + String(index)
  let signedOrder = await zknetWallets[index].signOrder(contractAddress, {
    id: orderId,
    type: 'LIMIT',
    positionId: positionId,
    positionToken: ERC20_ID,
    positionAmount: '100',
    fee: '1',
    extend: '{}',
  })
  console.log('signed order:', signedOrder)
  orders[index] = signedOrder
}

// mock bc
async function settlement() {
  const stNo = String(Math.floor(Date.now() / 1000))
  await sendTransaction('zkn_settlement', {
    partA: orders[0],
    partB: orders[1],
    settlement: {
      stNo: stNo,
      positionSold: '100',
      partAFee: '1',
      partBFee: '1',
    },
  })
}

// Wallet1

document.getElementById('connect0').onclick = async () => {
  console.log('Wallet1 connect')
  await connect(0)
}

document.getElementById('deposit0').onclick = async () => {
  console.log('Wallet1 deposit')
  await deposit(0)
}

document.getElementById('withdraw0').onclick = async () => {
  console.log('Wallet1 withdraw')
  await withdraw(0)
}

document.getElementById('positionDeposit0').onclick = async () => {
  console.log('Wallet1 positionDeposit')
  await positionDeposit(0)
}

document.getElementById('positionWithdraw0').onclick = async () => {
  console.log('Wallet1 positionWithdraw')
  await positionWithdraw(0)
}

document.getElementById('sign0').onclick = async () => {
  console.log('Wallet1 signOrder')
  await signOrder(0)
}

// Wallet2

document.getElementById('connect1').onclick = async () => {
  console.log('Wallet2 connect')
  await connect(1)
}

document.getElementById('deposit1').onclick = async () => {
  console.log('Wallet2 deposit')
  await deposit(1)
}

document.getElementById('withdraw1').onclick = async () => {
  console.log('Wallet2 withdraw')
  await withdraw(1)
}

document.getElementById('positionDeposit1').onclick = async () => {
  console.log('Wallet2 positionDeposit')
  await positionDeposit(1)
}

document.getElementById('positionWithdraw1').onclick = async () => {
  console.log('Wallet2 positionWithdraw')
  await positionWithdraw(1)
}

document.getElementById('sign1').onclick = async () => {
  console.log('Wallet2 signOrder')
  await signOrder(1)
}

// mock bc

document.getElementById('settlement').onclick = async () => {
  console.log('settlement')
  await settlement()
}
