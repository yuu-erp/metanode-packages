import { Chain, getAllWallets, getHiddenWallet, sendCommand } from "@metanodejs/system-core";

export interface ConnectChainProps {
  chain: Chain;
  wallets?: string[]; // truyền vào là list address string
}

export const connectChain = async (props: ConnectChainProps) => {
  const { chain, wallets = [] } = props;

  const allWallet = await getAllWallets();
  const { address } = await getHiddenWallet();
  console.log({ address });
  const walletAddress = allWallet.map((wallet) => wallet.address).filter(Boolean);

  // Ghép danh sách ví từ allWallet và wallets truyền vào
  const allAddresses = [...wallets, ...walletAddress, address];

  // Remove duplicates
  const uniqueAddresses = Array.from(new Set(allAddresses));

  // Convert sang object { address }
  const walletsToConnect = uniqueAddresses.map((addr) => ({ address: addr }));
  // console.log('walletsToConnect', walletsToConnect)

  if (walletsToConnect.length === 0) {
    console.warn("connectChain: No wallets available to connect.");
    return null;
  }

  const result = await sendCommand("connectNode", {
    wallets: walletsToConnect, // <== object array thay vì string array
    node: chain,
  });
  console.log("result----", result);
  return result;
};
