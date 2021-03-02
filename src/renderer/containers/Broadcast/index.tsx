import { ipcRenderer as ipc } from "electron-better-ipc";
import React from "react";

import { BouncingSlippiLogo } from "@/components/BouncingSlippiLogo";

export const Broadcast: React.FC = () => {
  const [slpFileInput, setSlpFileInput] = React.useState("");
  const [slpFileResult, setSlpFileResult] = React.useState("");
  const [numInput, setNumInput] = React.useState("");
  const [numResult, setNumResult] = React.useState<number | null>(null);
  return (
    <div>
      <h1>Broadcast</h1>
      <div>
        <input onChange={(e) => setNumInput(e.target.value)} value={numInput} />
        <button
          onClick={async () => {
            const res = await ipc.callMain<number, number>("synchronous-message", Number(numInput) - 1);
            setNumResult(res);
          }}
        >
          compute fibonacci
        </button>
        <pre>Result: {JSON.stringify(numResult)}</pre>
      </div>
      <BouncingSlippiLogo />
      <div>
        <input onChange={(e) => setSlpFileInput(e.target.value)} value={slpFileInput} />
        <button
          onClick={async () => {
            const res = await ipc.callMain<string, any>("processFile", slpFileInput);
            setSlpFileResult(res);
          }}
        >
          fetch slp info
        </button>
        <pre>{JSON.stringify(slpFileResult, null, 2)}</pre>
      </div>
    </div>
  );
};
