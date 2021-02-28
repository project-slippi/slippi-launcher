import { ipcRenderer } from "electron";
import React from "react";

import { BouncingSlippiLogo } from "@/components/BouncingSlippiLogo";

export const Broadcast: React.FC = () => {
  const [numInput, setNumInput] = React.useState("");
  const [numResult, setNumResult] = React.useState<number | null>(null);
  return (
    <div>
      <h1>Broadcast</h1>
      <div>
        <input type="text" onChange={(e) => setNumInput(e.target.value)} value={numInput} />
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
    </div>
  );
};
