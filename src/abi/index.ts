export type { Perpetual } from './perpetual'

export const perpetualABI = [
  'constructor(string,string)',
  'event LogBind(string,string)',
  'event LogDeposit(uint32 indexed,address indexed,uint256)',
  'event LogFundingTick(uint32,int256)',
  'event LogPositionChange(uint64 indexed,uint256,uint256)',
  'event LogPositionDeposit(uint64 indexed,uint32 indexed,address indexed,uint256)',
  'event LogPositionWithdrawn(uint64 indexed,uint32 indexed,address indexed,uint256)',
  'event LogTransfer(address,address,uint32,uint256)',
  'event LogWithdrawn(uint32 indexed,address indexed,uint256)',
  'event ManagerChanged(address indexed,address indexed)',
  'function balanceOf(address,uint32) view returns (int256)',
  'function bind(tuple(string,string,string))',
  'function chanageManager(address)',
  'function deleverage(tuple(uint64,uint256,uint256),tuple(uint64,uint256,uint256))',
  'function deposit(uint32,uint256)',
  'function disableManager()',
  'function domainSeparator() view returns (bytes32)',
  'function fundingTick(tuple(uint32,uint256)[])',
  'function liquidate(uint64,tuple(uint256,string,address,uint64,uint32,int256,uint256,string,uint32,bytes),tuple(uint256,uint256,uint256))',
  'function manager() view returns (address)',
  'function oraclePricesTick(tuple(uint32,uint256,tuple(string,uint256,uint64,string)[])[])',
  'function owner() view returns (address)',
  'function positionDeposit(uint64,uint32,uint256)',
  'function positionWithdraw(uint64,uint32,uint256)',
  'function registerToken(address,uint32)',
  'function settlement(tuple(uint256,string,address,uint64,uint32,int256,uint256,string,uint32,bytes),tuple(uint256,string,address,uint64,uint32,int256,uint256,string,uint32,bytes),tuple(uint256,uint256,uint256))',
  'function tokenAddress(uint32) view returns (address)',
  'function transfer(address,uint32,uint256,uint256)',
  'function withdraw(uint32,uint256)',
]

export const erc20ABI = [
  'event Approval(address indexed,address indexed,uint256)',
  'event Transfer(address indexed,address indexed,uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function transfer(address,uint256) returns (bool)',
  'function transferFrom(address,address,uint256) returns (bool)',
]