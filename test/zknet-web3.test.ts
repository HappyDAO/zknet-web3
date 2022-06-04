import * as zknet from '../src/zknet-web3'
import * as zksync from 'zksync-web3'
import { erc20ABI } from './erc20.abi'
import { ethers } from 'ethers'
import { log } from "console";

const contractAddress = ''
const ethUrl = 'http://localhost:8545'
const zksyncUrl = 'http://localhost:3050'
const zknetUrl = 'http://localhost:8088'
const ERC20_ADDRESS = '0x3fad2b2e21ea1c96618cc76a42fb5a77c3f71c6f'
const ETH_ADDRESS = zksync.utils.ETH_ADDRESS
const ETH_ID = 0
const ERC20_ID = 1

const wallet1PrivateKey = ''
const wallet2PrivateKey = ''

describe('Perpetual', () => {
  it('test vault', async () => {
    const perpetual = zknet.loadPerpetualContract(contractAddress)
    const zksyncProvider = new zksync.Provider(zksyncUrl)
    const zknetProvider = new zknet.Provider(zknetUrl)
    const ethProvider = ethers.getDefaultProvider(ethUrl)
    const erc20L2 = new zksync.Contract(ERC20_ADDRESS, erc20ABI, zksyncProvider)
    const ethL2 = new zksync.Contract(ETH_ADDRESS, erc20ABI, zksyncProvider)

    const zksyncWallet1 = new zksync.Wallet(wallet1PrivateKey, zksyncProvider, ethProvider)
    const zksyncWallet2 = new zksync.Wallet(wallet2PrivateKey, zksyncProvider, ethProvider)

    const wallet1 = zknet.Wallet.fromEthSigner(zksyncWallet1._signerL1(), perpetual)
    const wallet2 = zknet.Wallet.fromEthSigner(zksyncWallet2._signerL1(), perpetual)

    log("approve l2 eth");
    await (
      await ethL2.connect(zksyncWallet1).approve(perpetual.address, 100)
    ).wait();

    log("approve l2 erc20");
    await (
      await erc20L2.connect(zksyncWallet1).approve(perpetual.address, 100)
    ).wait();

    log("deposit eth to zknet");
    await (await perpetual.connect(zksyncWallet1).deposit(ETH_ID, 100)).wait();
    expect(await perpetual.connect(zksyncWallet1).balanceOf(zksyncWallet1.address, ETH_ID)).to.equal(100);

    log("deposit erc20 to zknet");
    await (await perpetual.connect(zksyncWallet1).deposit(ERC20_ID, 100)).wait();
    expect(await perpetual.connect(zksyncWallet1).balanceOf(zksyncWallet1.address, ERC20_ID)).to.equal(
      100
    );


    perpetual.populateTransaction.log("deposit to position");
    const positionId1 = 1;
    const positionId2 = 2;
    const orderId1 = 1;
    const orderId2 = 2;
    await (
      await perpetual
        .connect(randWallet1)
        .positionDeposit(positionId1, ERC20_ID, 50)
    ).wait();
    await (
      await perpetual
        .connect(randWallet2)
        .positionDeposit(positionId2, ERC20_ID, 50)
    ).wait();
    expect(await perpetual.connect(randWallet1).balanceOf(randWallet1.address, ERC20_ID)).to.equal(0);
    expect(await perpetual.connect(randWallet2).balanceOf(randWallet2.address, ERC20_ID)).to.equal(0);

    log("settlement order");
    await (
      await perpetual.connect(deployWallet).settlement(
        {
          id: orderId1,
          trader: randWallet1.address,
          positionId: positionId1,
          positionToken: ERC20_ID,
          positionAmount: 100,
          fee: 1,
          timestamp: Math.floor(Date.now() / 1000),
          signature: [1, 2, 3],
        },
        {
          id: orderId2,
          trader: randWallet2.address,
          positionId: positionId2,
          positionToken: ERC20_ID,
          positionAmount: -100,
          fee: 1,
          timestamp: Math.floor(Date.now() / 1000),
          signature: [1, 2, 3],
        },
        {
          partAActualAmount: 100,
          partBActualAmount: -100,
          partAFee: 1,
          partBFee: 1,
        }
      )
    ).wait();

    log("withdraw position");
    await (
      await perpetual
        .connect(randWallet1)
        .positionWithdraw(positionId1, ERC20_ID, 50)
    ).wait();
    await (
      await perpetual
        .connect(randWallet2)
        .positionWithdraw(positionId2, ERC20_ID, 50)
    ).wait();
    expect(await perpetual.connect(randWallet1).balanceOf(randWallet1.address, ERC20_ID)).to.equal(50);
    expect(await perpetual.connect(randWallet2).balanceOf(randWallet2.address, ERC20_ID)).to.equal(50);

    log("withdraw erc20");
    await (await perpetual.connect(randWallet1).withdraw(ERC20_ID, 50)).wait();
    expect(await perpetual.connect(randWallet1).balanceOf(randWallet1.address, ERC20_ID)).to.equal(0);
    expect(await randWallet1.getBalance(ERC20_ADDRESS)).to.equal(50);

    log("withdraw eth");
    await (await perpetual.connect(randWallet1).withdraw(ETH_ID, 100)).wait();
    expect(await perpetual.connect(randWallet1).balanceOf(randWallet1.address, ETH_ID)).to.equal(0);
  })
})
