import { ipcRenderer } from "electron";
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
            // const res = await fibonacci(Number(numInput) - 1);
            // setNumResult(res);
            ipcRenderer.once("synchronous-message-reply", (_, res) => {
              console.log(`got response from main: ${res}`);
              setNumResult(res);
            });
            ipcRenderer.send("synchronous-message", Number(numInput) - 1);
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
          onClick={() => {
            ipcRenderer.once("processFile-reply", (_, res) => {
              console.log(`got response from main: ${res}`);
              setSlpFileResult(res);
            });
            ipcRenderer.send("processFile", slpFileInput);
          }}
        >
          fetch slp info
        </button>
        <pre>{JSON.stringify(slpFileResult, null, 2)}</pre>
      </div>
    </div>
  );
};
