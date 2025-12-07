import { css } from "@emotion/react";
import Skeleton from "@mui/material/Skeleton";
import React from "react";

// Match the REPLAY_FILE_ITEM_SIZE from file_list.tsx
const REPLAY_FILE_ITEM_SIZE = 90;
const DEFAULT_SKELETON_COUNT = 10;

type FileListSkeletonProps = {
  count?: number;
};

export const FileListSkeleton = React.memo(({ count = DEFAULT_SKELETON_COUNT }: FileListSkeletonProps) => {
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;
      `}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          css={css`
            height: ${REPLAY_FILE_ITEM_SIZE}px;
          `}
        >
          <Skeleton
            variant="rounded"
            css={css`
              height: 80px;
              margin: 10px;
              border-radius: 10px;
            `}
          />
        </div>
      ))}
    </div>
  );
});
