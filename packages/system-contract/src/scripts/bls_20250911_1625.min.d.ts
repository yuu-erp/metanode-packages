declare module "../scripts/bls_20250911_1625.min.js" {
  const blsLib: {
    getKeyPair(privateKey: string): {
      public_key: Uint8Array;
      private_key?: Uint8Array;
    };
  };

  export default blsLib;
}
