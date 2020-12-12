import { verifyISO } from "@/lib/verifyISO";
import { remote } from "electron";
import React from "react";

export const ISOFileSelector: React.FC<{
  handlePathSelection: (isoPath: string) => void;
}> = ({ handlePathSelection }) => {
  const [loading, setLoading] = React.useState(false);
  const [verification, setVerification] = React.useState("");
  const onClick = async () => {
    const result = await remote.dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "ISO", extensions: ["iso"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });
    // res.filePaths
    // console.log(res.filePaths);
    // const result = await dialog.showOpenDialog(options);
    const res = result.filePaths;
    console.log(res);
    if (result.canceled || res.length === 0) {
      throw new Error("User cancelled file selection");
    }
    const meleeIsoPath = res[0];

    try {
      setVerification("");
      setLoading(true);
      const verifyResult = await verifyISO(meleeIsoPath);
      if (verifyResult.valid) {
        setVerification("Valid ISO");
        handlePathSelection(meleeIsoPath);
      } else {
        setVerification(`Invalid ISO. ${verifyResult.name} is not supported.`);
      }
    } catch (err) {
      setVerification("Invalid ISO.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <button onClick={onClick}>click to select iso file</button>
      {loading && <div>Verifying ISO...</div>}
      {!loading && verification && <div>{verification}</div>}
    </div>
  );
};
