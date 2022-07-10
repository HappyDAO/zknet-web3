import 'mocha'
import { expect } from 'chai'
import * as zknet from '../src/zknet-web3'
import * as zksync from 'zksync-web3'
import { ethers } from 'ethers'

const contractAddress = '0x297EAF76e4287484A63eA03399423D33B239d20d'
const ethUrl = 'http://121.89.245.161:8545'
const zksyncUrl = 'http://121.89.245.161:3050'
const zknetUrl = 'http://121.89.245.161:80'
const ERC20_ADDRESS = '0x3fad2b2e21ea1c96618cc76a42fb5a77c3f71c6f'
const ERC20_ID = 1

const ethProvider = ethers.getDefaultProvider(ethUrl)
const zksyncProvider = new zksync.Provider(zksyncUrl)
const zknetProvider = new zknet.Provider(zknetUrl)
const perpetual = zknet.loadPerpetualContract(contractAddress)
const erc20L2 = new zksync.Contract(ERC20_ADDRESS, zknet.erc20ABI, zksyncProvider)
const erc20L1 = new ethers.Contract(ERC20_ADDRESS, zknet.erc20ABI, ethProvider)

jest.setTimeout(100000000)

describe('Wallet', function () {
  async function sendTransaction(method: string, param = {}) {
    let txHash = await zknetProvider.sendTransaction(method, param)
    const res = await zksyncProvider.getTransaction(txHash)
    res.wait()
  }

  it('test api', async function () {
    const testAccount = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110'
    const testAccountZksyncWallet = new zksync.Wallet(testAccount, zksyncProvider, ethProvider)

    const zknetWallet = await zknet.Wallet.fromZksyncWallet(testAccountZksyncWallet, perpetual)

    await zknetWallet.l1BalanceOf(ERC20_ID)
    const beforeL2Balance = await zknetWallet.l2BalanceOf(ERC20_ID)
    await zknetWallet.balanceOf(ERC20_ID)

    await zknetWallet.approveToken(ERC20_ID, '100')

    await zknetWallet.depositToL2Account(ERC20_ID, '100')
    const afterL2Balance = await zknetWallet.l2BalanceOf(ERC20_ID)
    expect(afterL2Balance._hex).to.equal(beforeL2Balance.add(100)._hex)

    expect(await zknetWallet.signMessage('test')).to.be.not.equal('')
    expect(await zknetWallet.signBindTx()).to.be.equal('')

    let signedTx = await zknetWallet.signDepositTx(ERC20_ID, '100')
    expect(signedTx).to.be.not.equal('')
    await sendTransaction('zkn_deposit', {
      address: zknetWallet.l2Address,
      timestamp: Math.floor(Date.now() / 1000),
      sign: signedTx,
      token: ERC20_ID,
      amount: '100',
    })

    // expect(
    //   await zknetWallet.signTransferTx(
    //     '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
    //     ERC20_ID,
    //     '100',
    //     ''
    //   )
    // ).to.be.not.equal('')

    const positionId = '100234'
    signedTx = await zknetWallet.signPositionDepositTx(positionId, ERC20_ID, '100')
    expect(signedTx).to.be.not.equal('')
    await sendTransaction('zkn_positionDeposit', {
      address: zknetWallet.l2Address,
      timestamp: Math.floor(Date.now() / 1000),
      sign: signedTx,
      positionId: positionId,
      token: ERC20_ID,
      amount: '100',
    })

    const order = await zknetWallet.signOrder({
      id: '1',
      type: 'LIMIT',
      positionId: positionId,
      positionToken: ERC20_ID,
      positionAmount: '100',
      fee: '1',
      extend: '{}',
    })
    expect(order.signature).to.be.not.equal('')

    signedTx = await zknetWallet.signPositionWithdrawTx(positionId, ERC20_ID, '100')
    expect(signedTx).to.be.not.equal('')
    await sendTransaction('zkn_positionWithdraw', {
      address: zknetWallet.l2Address,
      timestamp: Math.floor(Date.now() / 1000),
      sign: signedTx,
      positionId: positionId,
      token: ERC20_ID,
      amount: '100',
    })

    expect(await zknetWallet.signWithdrawTx(ERC20_ID, '100')).to.be.not.equal('')

    await zknetWallet.withdrawFromL2Account(ERC20_ID, '100')
    await zknetWallet.l2BalanceOf(ERC20_ID)
  })
})
