import { useReplays } from "@/store/replays";
import { FileResult } from "common/replayBrowser";
import React from "react";
import { GameProfile } from "./GameProfile";

export interface ReplayFileStatsProps {
  file: FileResult;
  index: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export const ReplayFileStats: React.FC<ReplayFileStatsProps> = (props) => {
  const { file, index, total, onNext, onPrev, onClose } = props; //TODO remove

  const loading = useReplays((store) => store.selectedFile.loading);
  const error = useReplays((store) => store.selectedFile.error);
  const gameStats = useReplays((store) => store.selectedFile.gameStats);
  return (
    <div>
      <div>{file.name}</div>
      <div>
        {index + 1} / {total}
      </div>
      <button disabled={loading} onClick={onClose}>
        Close
      </button>
      <button disabled={loading || index === 0} onClick={onPrev}>
        Prev
      </button>
      <button disabled={loading || index === total - 1} onClick={onNext}>
        Next
      </button>
      <div>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>
            Error occurred: {JSON.stringify(error.message || error, null, 2)}
          </div>
        ) : (
          <div style={{ marginLeft: "16px" }}>
            <GameProfile {...props}></GameProfile>
            <pre>{JSON.stringify(gameStats, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
