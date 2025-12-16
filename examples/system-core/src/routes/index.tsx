import { createFileRoute } from "@tanstack/react-router";
import logo from "../logo.svg";
import { SystemCoreBase } from "@metanodejs/system-core";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const systemCoreBase = useRef<SystemCoreBase>(new SystemCoreBase({ isDebug: false }));
  const fetchAllWallet = async () => {
    if (!systemCoreBase.current) return;

    const requests = Array.from({ length: 1 }, (_) =>
      systemCoreBase.current!.send({
        command: "getAllWallets",
      }),
    );

    try {
      const results = await Promise.all(requests);
      console.log("results:", results);
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
