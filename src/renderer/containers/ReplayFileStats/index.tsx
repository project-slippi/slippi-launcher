import { useReplays } from "@/store/replays";
import { FileResult } from "common/replayBrowser";
import React from "react";
import { GameProfile } from "./GameProfile";
import { LoadingScreen } from "@/components/LoadingScreen";

export interface ReplayFileStatsProps {
  file: FileResult;
  index: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export const ReplayFileStats: React.FC<ReplayFileStatsProps> = (props) => {
  // const { file, index, total, onNext, onPrev, onClose } = props;

  const loading = useReplays((store) => store.selectedFile.loading);
  const error = useReplays((store) => store.selectedFile.error);
  const gameStats = useReplays((store) => store.selectedFile.gameStats);
  return (
    <div>
      <div>
        {loading ? (
          <div>
            <LoadingScreen
              message={"Fetching Stats..."}
              style={{
                position: "absolute",
                backgroundColor: "rgba(0,0,0,0.8)",
              }}
            />
          </div>
        ) : error ? (
          <div>
            Error occurred: {JSON.stringify(error.message || error, null, 2)}
          </div>
        ) : gameStats ? (
          <div>
            <GameProfile {...props} stats={gameStats}></GameProfile>
          </div>
        ) : (
          <div>Error computing stats</div>
        )}
      </div>
    </div>
  );
};
