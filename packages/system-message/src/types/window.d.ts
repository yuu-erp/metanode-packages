import type { ElectronAPI, FindSDK, Webkit } from './env'
export {}

declare global {
  interface Window {
    appId?: string
    electronAPI?: ElectronAPI
    finsdk?: FindSDK
    webkit?: Webkit
  }
}
