import * as zknet from '../../src/zknet-web3'
import * as zksync from 'zksync-web3'
import { ethers } from 'ethers'
import { ETH_ADDRESS, sleep } from 'zksync-web3/build/utils'

const contractAddress = '0x297EAF76e4287484A63eA03399423D33B239d20d'
const ethUrl = 'http://121.89.245.161:8545'
const zksyncUrl = 'http://121.89.245.161:3050'
const zknetUrl = 'http://121.89.245.161:80'
const ERC20_ADDRESS = '0x3fad2b2e21ea1c96618cc76a42fb5a77c3f71c6f'
const ERC20_ID = 1
const testAccount = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110'

const ethProvider = ethers.getDefaultProvider(ethUrl)
const zksyncProvider = new zksync.Provider(zksyncUrl)
const zknetProvider = new zknet.Provider(zknetUrl)
const perpetual = zknet.loadPerpetualContract(contractAddress)
const erc20L2 = new zksync.Contract(ERC20_ADDRESS, zknet.erc20ABI, zksyncProvider)
const erc20L1 = new ethers.Contract(ERC20_ADDRESS, zknet.erc20ABI, ethProvider)
const testAccountEthWallet = new ethers.Wallet(testAccount, ethProvider)
const testAccountZksyncWallet = new zksync.Wallet(testAccount, zksyncProvider, ethProvider)

let zksyncWallets: zksync.Wallet[] = [undefined, undefined]
let zknetWallets: zknet.Wallet[] = [undefined, undefined]

let orders: zknet.SignedOrder[] = [undefined, undefined]

let uuid = Math.floor(Date.now() / 1000)
let order_ids: string[] = [String(uuid), String(uuid + 1)]

async function sendToken(index: number, amount: string) {
  const gasPrice = await testAccountEthWallet.getGasPrice()
  await (
    await testAccountEthWallet.sendTransaction({
      to: zknetWallets[index].getL1Address(),
      value: ethers.utils.parseEther('10000'),
      nonce: testAccountEthWallet.getTransactionCount('latest'),
      gasLimit: ethers.utils.hexlify('0x100000'),
      gasPrice: gasPrice,
    })
  ).wait()

  await (
    await testAccountEthWallet.sendTransaction({
      to: zknetWallets[index].getZksyncWallet().address,
      value: ethers.utils.parseEther('10000'),
      nonce: testAccountEthWallet.getTransactionCount('latest'),
      gasLimit: ethers.utils.hexlify('0x100000'),
      gasPrice: gasPrice,
    })
  ).wait()

  await (
    await erc20L1.connect(testAccountEthWallet).transfer(zknetWallets[index].getL1Address(), amount)
  ).wait()

  await (
    await testAccountZksyncWallet.deposit({
      to: zknetWallets[index].getZksyncWallet().address,
      token: ETH_ADDRESS,
      amount: ethers.utils.parseEther('10000'),
      approveERC20: true,
    })
  ).wait()

  await updatel1Balance(index)
}

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

async function updatel1Balance(index: number) {
  console.log('update l1 balance')
  let balance = await zknetWallets[index].l1BalanceOf(ERC20_ID)
  document.getElementById('l1Balance' + index).value = balance.toString()
}

async function updatel2Balance(index: number) {
  console.log('update l2 balance')
  let balance = await zknetWallets[index].l2BalanceOf(ERC20_ID)
  document.getElementById('l2Balance' + index).value = balance.toString()
}

async function updateBalance(index: number) {
  console.log('update balance')
  let balance = await perpetual
    .connect(zksyncWallets[index])
    .balanceOf(zksyncWallets[index].address, ERC20_ID)
  document.getElementById('balance' + index).value = balance.toString()
}

async function connect(index: number) {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  await provider.send('eth_requestAccounts', [])
  const signer = provider.getSigner()
  const zknetWallet = await zknet.Wallet.fromEthSigner(signer, contractAddress, zksyncUrl, provider)

  // const zknetWallet = await zknet.Wallet.fromZksyncWallet(
  //   new zksync.Wallet(pks[index], zksyncProvider, ethProvider),
  //   perpetual
  // )
  zksyncWallets[index] = zknetWallet.getZksyncWallet()
  zknetWallets[index] = zknetWallet
  console.log(zknetWallets[index].getZksyncWallet().address)
  await updateBalance(index)
  await updatel1Balance(index)
  await updatel2Balance(index)
  document.getElementById('connect' + index).style.display = 'none'
  document.getElementById('connected' + index).style.display = 'block'
}

async function depositTol2(index: number, amount: string) {
  await zknetWallets[index].depositToL2Account(ERC20_ID, amount)
  await updatel2Balance(index)
  sleep(2000)
  await updatel1Balance(index)
}

async function withdrawFroml2(index: number, amount: string) {
  await zknetWallets[index].withdrawFromL2Account(ERC20_ID, amount)
  await updatel2Balance(index)
  sleep(2000)
  await updatel1Balance(index)
}

async function deposit(index: number, amount: string) {
  await (await erc20L2.connect(zksyncWallets[index]).approve(perpetual.address, amount)).wait()
  let signedTx = await zknetWallets[index].signDepositTx(ERC20_ID, amount)
  await sendTransactionAndUpdateBalance(index, 'zkn_deposit', {
    address: zksyncWallets[index].address,
    timestamp: Math.floor(Date.now() / 1000),
    sign: signedTx,
    token: ERC20_ID,
    amount: amount,
  })
  await updatel2Balance(index)
}

async function withdraw(index: number, amount: string) {
  let signedTx = await zknetWallets[index].signWithdrawTx(ERC20_ID, amount)
  await sendTransactionAndUpdateBalance(index, 'zkn_withdraw', {
    address: zksyncWallets[index].address,
    timestamp: Math.floor(Date.now() / 1000),
    sign: signedTx,
    token: ERC20_ID,
    amount: amount,
  })
  await updatel2Balance(index)
}

async function positionDeposit(index: number, amount: string) {
  const positionId = order_ids[index]
  let signedTx = await zknetWallets[index].signPositionDepositTx(positionId, ERC20_ID, amount)
  await sendTransactionAndUpdateBalance(index, 'zkn_positionDeposit', {
    address: zksyncWallets[index].address,
    timestamp: Math.floor(Date.now() / 1000),
    sign: signedTx,
    positionId: positionId,
    token: ERC20_ID,
    amount: amount,
  })
}

async function positionWithdraw(index: number, amount: string) {
  const positionId = order_ids[index]
  let signedTx = await zknetWallets[index].signPositionWithdrawTx(positionId, ERC20_ID, amount)
  await sendTransactionAndUpdateBalance(index, 'zkn_positionWithdraw', {
    address: zksyncWallets[index].address,
    timestamp: Math.floor(Date.now() / 1000),
    sign: signedTx,
    positionId: positionId,
    token: ERC20_ID,
    amount: amount,
  })
}

async function signOrder(index: number, amount: string) {
  let signedOrder = await zknetWallets[index].signOrder({
    id: order_ids[index],
    type: 'LIMIT',
    positionId: order_ids[index],
    positionToken: ERC20_ID,
    positionAmount: amount,
    fee: '1',
    extend: '{}',
  })
  console.log('signed order:', signedOrder)
  orders[index] = signedOrder

  const jsonStr = JSON.stringify(signedOrder, null, 4)
  document.getElementById('order' + index).innerHTML = jsonStr
}

// mock bc
async function settlement(amount: string) {
  if (orders[0] == undefined || orders[1] == undefined) {
    throw new Error('need 2 signed order')
  }
  const stNo = String(Math.floor(Date.now() / 1000))
  await sendTransaction('zkn_settlement', {
    partA: orders[0],
    partB: orders[1],
    settlement: {
      stNo: stNo,
      positionSold: amount,
      partAFee: '1',
      partBFee: '1',
    },
  })
}

// Wallet1

document.getElementById('connect0').onclick = async () => {
  showLoading()
  try {
    console.log('Wallet1 connect')
    await connect(0)
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

document.getElementById('refresh0').onclick = async () => {
  showLoading()
  try {
    await updateBalance(0)
    await updatel1Balance(0)
    await updatel2Balance(0)
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

document.getElementById('prepareWallet0').onclick = async () => {
  showLoading()
  try {
    const amount = document.getElementById('prepareWallet0Input').value
    console.log('Wallet1 get tokens')
    await sendToken(0, amount)
    completeLoading()
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

document.getElementById('l2Deposit0').onclick = async () => {
  showLoading()
  try {
    const amount = document.getElementById('l2Deposit0Input').value
    console.log('Wallet1 deposit to l2')
    await depositTol2(0, amount)
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

document.getElementById('l2Withdraw0').onclick = async () => {
  showLoading()
  try {
    const amount = document.getElementById('l2Withdraw0Input').value
    console.log('Wallet1 withdraw to l2')
    await withdrawFroml2(0, amount)
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

document.getElementById('deposit0').onclick = async () => {
  showLoading()
  try {
    const amount = document.getElementById('deposit0Input').value
    console.log('Wallet1 deposit')
    await deposit(0, amount)
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

document.getElementById('withdraw0').onclick = async () => {
  showLoading()
  try {
    const amount = document.getElementById('withdraw0Input').value
    console.log('Wallet1 withdraw')
    await withdraw(0, amount)
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

document.getElementById('positionDeposit0').onclick = async () => {
  showLoading()
  try {
    const amount = document.getElementById('positionDeposit0Input').value
    console.log('Wallet1 positionDeposit')
    await positionDeposit(0, amount)
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

document.getElementById('positionWithdraw0').onclick = async () => {
  showLoading()
  try {
    const amount = document.getElementById('positionWithdraw0Input').value
    console.log('Wallet1 positionWithdraw')
    await positionWithdraw(0, amount)
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

document.getElementById('sign0').onclick = async () => {
  showLoading()
  try {
    const amount = document.getElementById('sign0Input').value
    console.log('Wallet1 signOrder')
    await signOrder(0, amount)
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

// Wallet2

document.getElementById('connect1').onclick = async () => {
  showLoading()
  try {
    console.log('Wallet2 connect')
    await connect(1)
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

document.getElementById('refresh1').onclick = async () => {
  showLoading()
  try {
    await updateBalance(1)
    await updatel1Balance(1)
    await updatel2Balance(1)
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

document.getElementById('prepareWallet1').onclick = async () => {
  showLoading()
  try {
    const amount = document.getElementById('prepareWallet1Input').value
    console.log('Wallet2 get tokens')
    await sendToken(1, amount)
    completeLoading()
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

document.getElementById('l2Deposit1').onclick = async () => {
  showLoading()
  try {
    const amount = document.getElementById('l2Deposit1Input').value
    console.log('Wallet2 deposit to l2')
    await depositTol2(1, amount)
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

document.getElementById('l2Withdraw1').onclick = async () => {
  showLoading()
  try {
    const amount = document.getElementById('l2Withdraw1Input').value
    console.log('Wallet2 withdraw to l2')
    await withdrawFroml2(1, amount)
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

document.getElementById('deposit1').onclick = async () => {
  showLoading()
  try {
    const amount = document.getElementById('deposit1Input').value
    console.log('Wallet2 deposit')
    await deposit(1, amount)
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

document.getElementById('withdraw1').onclick = async () => {
  showLoading()
  try {
    const amount = document.getElementById('withdraw1Input').value
    console.log('Wallet2 withdraw')
    await withdraw(1, amount)
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

document.getElementById('positionDeposit1').onclick = async () => {
  showLoading()
  try {
    const amount = document.getElementById('positionDeposit1Input').value
    console.log('Wallet2 positionDeposit')
    await positionDeposit(1, amount)
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

document.getElementById('positionWithdraw1').onclick = async () => {
  showLoading()
  try {
    const amount = document.getElementById('positionWithdraw1Input').value
    console.log('Wallet2 positionWithdraw')
    await positionWithdraw(1, amount)
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

document.getElementById('sign1').onclick = async () => {
  showLoading()
  try {
    const amount = document.getElementById('sign1Input').value
    console.log('Wallet2 signOrder')
    await signOrder(1, amount)
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

// mock bc

document.getElementById('settlement').onclick = async () => {
  showLoading()
  try {
    const amount = document.getElementById('settlementInput').value
    console.log('settlement')
    await settlement(amount)
  } catch (error) {
    console.log(error)
    alert(error)
  } finally {
    completeLoading()
  }
}

function completeLoading() {
  document.getElementById('loadingDiv').style.display = 'none'
}
function showLoading() {
  document.getElementById('loadingDiv').style.display = 'block'
}

async function doAction() {}
