import { createFileRoute } from "@tanstack/react-router";
import logo from "../logo.svg";
import { SystemCoreBase } from "@metanodejs/system-core";
import { useEffect, useRef } from "react";
import { MtnContract } from "@metanodejs/system-contract";

export const Route = createFileRoute("/")({
  component: App,
});
function App() {
  const systemCoreBase = useRef<SystemCoreBase>(new SystemCoreBase({ isDebug: false }));
  const mtnContract = useRef<MtnContract>(
    new MtnContract("0xc0d76B3778951E085937b2B5Cc63632cd39babb4", [
      {
        inputs: [
          {
            internalType: "address",
            name: "account",
            type: "address",
          },
        ],
        name: "balanceOf",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "user",
            type: "address",
          },
        ],
        name: "checkUserContract",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ]),
  );
  const fetchAllWallet = async () => {
    if (!systemCoreBase.current || !mtnContract.current) return;

    try {
      const results = await systemCoreBase.current!.send<{ address: string }[]>({
        command: "getAllWallets",
      });
      console.log("results:", results[0].address);
      const data = await mtnContract.current.call(
        "checkUserContract",
        [results[0].address],
        results[0].address,
      );
      console.log("data:", data);
      const balanceOf = await systemCoreBase.current!.send({
        command: "executeSmartContract",
        value: {
          functionName: "balanceOf",
          from: results[0].address,
          to: "0x9998B5518EC3b0BA6b9e2593DA2dD8b70D78DbC7",
          abiData: [
            {
              inputs: [
                {
                  internalType: "address",
                  name: "account",
                  type: "address",
                },
              ],
              name: "balanceOf",
              outputs: [
                {
                  internalType: "uint256",
                  name: "",
                  type: "uint256",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
          ],
          feeType: "read",
          value: "0",
          gas: "3000000",
          inputArray: [
            {
              internalType: "address",
              name: "account",
              type: "address",
              value: results[0].address,
            },
          ],
        },
      });
      console.log("balanceOf:", balanceOf);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAllWallet();
  }, []);
  return (
    <div className="text-center">
      <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
        <img
          src={logo}
          className="h-[40vmin] pointer-events-none animate-[spin_20s_linear_infinite]"
          alt="logo"
        />
        <p>
          Edit <code>src/routes/index.tsx</code> and save to reload.
        </p>
        <a
          className="text-[#61dafb] hover:underline"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <a
          className="text-[#61dafb] hover:underline"
          href="https://tanstack.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn TanStack
        </a>
      </header>
    </div>
  );
}
