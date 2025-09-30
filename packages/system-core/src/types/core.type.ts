export enum TransactionStatus {
  none,
  failed,
  success
}

export type Permission = 'camera' | 'photo' | 'micro' | 'location' | 'read_contacts' | 'bluetooth'

export interface DappPosition {
  x: number
  y: number
  width: number
  height: number
}

export type AppType = 'UApp' | 'DApp'

export interface OpenAppInTaskbar {
  type: AppType
  bundleId: string
}

export interface Chain {
  ip: string
  port: number
}

export interface TNode {
  id: any
  ip: string
  port: string
  domain?: string
  location?: string
  storageAddress?: any
  storageHost?: any
}

export interface Dapp {
  abiData: any[]
  author: string
  binData: string
  bundleId: string
  constructorData: string
  createTime: number
  groupId: number
  hash: string
  id: number
  isAutoScript: number
  isDefault: number
  isFavorite: number
  isFullScreen: number
  isHidden: number
  isLocked: number
  isUserApp: number
  lastTimeModified: number
  lastTimeOpen: number
  logo: string
  name: string
  orientation: string
  page: number
  parent: string
  pathStorage: string
  position: DappPosition
  profileId: number
  scriptStr: string
  sign: string
  size: number
  statusBar: string
  type: number
  url: string
  urlPack: string
  urlScript: string
  version: string
  isTaskbar: number
}

export interface Wallet {
  id: number
  name: string
  address: string
  addressBls: string
  backgroundImage: string
  publicKey: string
  privateKey: string
  seed: string
  totalBalanceString: string
  textColor: string
}

export interface Seed {
  address: string
  listSeed: string[]
}

export interface Token {
  id: number
  address: string
  name: string
  symbol: string
  decimals: number
  balanceString: string
  totalSupplyString: string
  parentAddress?: string
  logo?: string
  logoUrl?: string
  nodeAddress?: string
}

export interface Profile {
  id: number
  name: string
  password: string
  passwordLockDApp: string
  pinCodeHideDApp: string
  isHidden: number
  userName: string
  avatar: string
  backgroundImage: string
  isProtected: number
  lastTimeLogin: number
  screenSize: string
  lockScreenDisplayType: number
}

export interface IFile {
  path: string
  fileName: string
  time: string
  size: string
}
export interface UnzipedFile {
  name: string
  path: string
  size: number
  sizeString: string
}

export interface WalletFile {
  publicKey: string
  privateKey: string
  seed: string[]
}

export interface SendMtdResponse {
  amount: string
  amountString: string
  currentBalance: string
  currentBalanceString: string
  fee: string
  feeString: string
  fromAddress: string
  functionName: string
  hash: string
  id: number
  isCall: number
  isDeploy: number
  isReward: number
  lastDeviceKey: string
  message: string
  nodeAddress: string
  profileId: number
  publicKey: string
  receiveInfo: string
  returnValue: string
  sign: string
  status: TransactionStatus
  time: number
  toAddress: string
  tokenAddress: string
  totalAmount: string
  totalAmountString: string
  type: string
}

export interface WalletHistoryData {
  id: number
  hash: string
  fromAddress: string
  toAddress: string
  publicKey: string
  amount: string
  amountString: string
  currentBalance: string
  currentBalanceString: string
  fee: string
  feeString: string
  message: string
  time: number
  status: number
  type: string
  sign: string
  receiveInfo: string
  isDeploy: number
  isCall: number
  functionName: string
  totalAmount: string
  totalAmountString: string
  lastDeviceKey: string
  profileId: number
  isReward: number
  returnValue: string
  abiData: any[]
  tokenAddress: string
  inputArray: any[]
  nodeAddress: string
}

export interface WalletHistoryResponse {
  totalPage: number
  total: number
  currentPage: number
  perPage: number
  data: WalletHistoryData[]
}

export interface IInsertProfile {
  name: string
  password: string | undefined
  isHidden: number
  avatar: string
  backgroundImage: string
  screenSize: string
}

export interface ILoadMainWithRef {
  refCode?: string
  installUrl?: string
  domain?: string
  bundleId?: string
  profileId: any
  isStore: boolean
}

export type Address = string

export type FeeType = 'user' | 'read' | 'sc'

export interface AbiInputOutput {
  name?: string
  type?: string
  components?: unknown[]
}

export interface AbiItem {
  name: string
  type: string
  inputs: AbiInputOutput[]
  outputs: AbiInputOutput[]
  stateMutability: string
}

export interface CallFunctionPayload {
  to?: Address
  from?: Address
  abiData: AbiItem | AbiItem[]
  functionName: string
  inputArray?: any[]
  inputData?: any
  value?: string
  amount?: string
  gas?: string | number
  feeType?: FeeType
  isCall?: boolean
  isReadOnly?: boolean
  type?: string
  abiEvent?: any[]
}
