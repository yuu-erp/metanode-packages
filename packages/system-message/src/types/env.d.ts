import type { TransportMessage } from '.'

export interface ElectronAPI {
  sendMessage: (channel: string, payload: TransportMessage) => void
  onMessage: (channel: string, callback: (event: MessageEvent) => void) => void
  windowId?: string
}
export interface FindSDK {
  call: (payload: TransportMessage) => void
}
export interface Webkit {
  messageHandlers: {
    callbackHandler: {
      postMessage: (payload: string) => void
    }
  }
}
