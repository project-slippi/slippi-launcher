import { FileResult } from "common/replayBrowser";
import React from "react";

export interface ReplayFileStatsProps {
  file: FileResult;
  index: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export const ReplayFileStats: React.FC<ReplayFileStatsProps> = ({
  file,
  index,
  total,
  onNext,
  onPrev,
  onClose,
}) => {
  return (
    <div>
      <div>{file.name}</div>
      <div>
        {index + 1} / {total}
      </div>
      <button onClick={onClose}>Close</button>
      <button disabled={index === 0} onClick={onPrev}>
        Prev
      </button>
      <button disabled={index === total - 1} onClick={onNext}>
        Next
      </button>
    </div>
  );
};
