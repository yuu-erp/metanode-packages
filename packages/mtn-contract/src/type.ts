declare global {
  interface Window {
    finSdk: {
      init: any;
      call: any;
      sendTransaction: any;
    };
  }
}

export {};
