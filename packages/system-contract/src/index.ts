import { JsonRpcProvider, type Address } from "./providers"; // tuỳ path project

console.log("METANODE CONTRACT – PROVIDER FULL TEST");

const provider = new JsonRpcProvider("https://rpc-proxy-sequoia.iqnb.com:8446/");
const address: Address = "0x77a1f4f69976dc33d05a0b8df190dcd061ca0080";

(async () => {
  try {
    // -------------------------
    // Network
    // -------------------------
    const network = await provider.getNetwork();
    console.log("network:", network);

    // -------------------------
    // Account state (Metanode native)
    // -------------------------
    const accountState = await provider.getAccountState(address);
    console.log("accountState:", accountState);

    const deviceKey = await provider.getDeviceKey(accountState.lastHash);
    console.log("deviceKey:", deviceKey);

    // -------------------------
    // Ethereum-compatible account info
    // -------------------------
    const nonce = await provider.getTransactionCount(address, "latest");
    console.log("nonce:", nonce);

    const balance = await provider.getBalance(address, "latest");
    console.log("balance:", balance);

    // -------------------------
    // Blocks
    // -------------------------
    const blockNumber = await provider.getBlockNumber();
    console.log("blockNumber:", blockNumber);

    const latestBlock = await provider.getBlock("latest");
    console.log("latestBlock.hash:", latestBlock.hash);
    console.log("latestBlock.timestamp:", latestBlock.timestamp);

    // -------------------------
    // Call (read-only EVM call)
    // Ví dụ: gọi balanceOf(address) ERC20 (mock data)
    // -------------------------
    // const callResult = await provider.call(
    //   {
    //     to: address,
    //     data: "0x", // empty call – chỉ để test RPC path
    //   },
    //   "latest",
    // );
    // console.log("callResult:", callResult);

    // -------------------------
    // Estimate gas (mock tx)
    // -------------------------
    // const estimatedGas = await provider.estimateGas({
    //   from: address,
    //   to: address,
    //   value: 0n,
    // });
    // console.log("estimatedGas:", estimatedGas.toString());

    // -------------------------
    // Logs (empty filter example)
    // -------------------------
    const logs = await provider.getLogs({
      fromBlock: "latest",
    });
    console.log("logs.length:", logs.length);

    // -------------------------
    // Transactions (read path)
    // -------------------------
    // if (latestBlock.transactions.length > 0) {
    //   const txHash = latestBlock.transactions[0];
    //   console.log("sampleTxHash:", txHash);

    //   const tx = await provider.getTransaction(txHash);
    //   console.log("transaction:", tx);

    //   const receipt = await provider.getTransactionReceipt(txHash);
    //   console.log("receipt:", receipt);
    // } else {
    //   console.log("No transactions in latest block");
    // }

    // -------------------------
    // Events (stub)
    // -------------------------
    provider.on("block", () => {
      console.log("new block event");
    });

    provider.off("block", () => {
      console.log("unsubscribe block event");
    });

    console.log("✅ Provider test completed successfully");
  } catch (error) {
    console.error("❌ RPC ERROR:", error);
  }
})();
