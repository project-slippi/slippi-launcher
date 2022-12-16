import { css } from "@emotion/react";
import styled from "@emotion/styled";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ErrorIcon from "@mui/icons-material/Error";
import { Button, IconButton } from "@mui/material";
import type { FileResult } from "@replays/types";
import _ from "lodash";
import React from "react";

import { BasicFooter } from "@/components/Footer";
import { IconMessage } from "@/components/Message";
import { useGlobalStats } from "@/lib/hooks/useGlobalStats";
import { useReplays } from "@/lib/hooks/useReplays";

import { GeneralStats } from "./general/GeneralStats";

const Outer = styled.div<{
  backgroundImage?: any;
}>`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  &::before {
    z-index: -1;
    position: absolute;
    height: 100%;
    width: 100%;
    content: "";
    background-size: cover;
    background-position: center center;
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0 100%),
      ${(p) => (p.backgroundImage ? `url("${p.backgroundImage}")` : "")};
    box-shadow: inset 0 0 2000px rgba(255, 255, 255, 0.2);
    filter: blur(10px);
  }
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  overflow: auto;
`;

export interface GlobalStatsProps {
  files: FileResult[];
  onClose: () => void;
}

export const GlobalStats: React.FC<GlobalStatsProps> = ({ onClose }) => {
  const compute = useGlobalStats((store) => store.compute);
  const stats = useGlobalStats((store) => store.stats);
  const oldFiles = useGlobalStats((store) => store.files);
  const filters = {
    characters: [],
    opponentCharacters: [],
    opponents: [],
  };
  const error = undefined;

  const files = useReplays((store) => store.files);
  if (files !== oldFiles) {
    compute(files, filters);
  }

  return (
    <Outer>
      <BasicFooter>
        <div
          css={css`
            display: flex;
            flex-direction: column;
            margin-left: 10px;
            padding-right: 20px;
          `}
        >
          <div
            css={css`
              font-weight: bold;
              text-transform: uppercase;
              color: white;
            `}
          >
            <IconButton onClick={onClose} disabled={false} css={css``} size="large">
              <ArrowBackIosIcon fontSize="small" />
            </IconButton>
            Back
          </div>
        </div>
        <div
          css={css`
            margin-left: auto;
            margin-right: 50px;
          `}
        >
          <Button css={css``}>Filter</Button>
        </div>
      </BasicFooter>
      <Content>
        {error ? (
          <IconMessage Icon={ErrorIcon} label={`Error: ${error ?? JSON.stringify(error, null, 2)}`} />
        ) : !stats ? (
          <IconMessage Icon={ErrorIcon} label={`Error: ${error ?? JSON.stringify(error, null, 2)}`} />
        ) : (
          <GeneralStats player={"EAST#312"!} stats={stats}></GeneralStats>
        )}
      </Content>
    </Outer>
  );
};
