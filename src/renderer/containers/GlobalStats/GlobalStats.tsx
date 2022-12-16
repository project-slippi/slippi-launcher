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

import { StatSection } from "../ReplayFileStats/GameProfile";
import { GeneralStats } from "./general/GeneralStats";
import { ProgressionStats } from "./general/ProgressionStats";

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
  const setActive = useGlobalStats((store) => store.setActiveView);
  const activeView = useGlobalStats((store) => store.active);
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

  const getButtonVariant = (view: string) => (view == activeView ? "contained" : "outlined");

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
          <>
            <div style={{ flex: "1", margin: "auto", maxWidth: 1500 }}>
              <StatSection>
                <div
                  css={css`
                    display: flex;
                    flex-direction: row;
                    flex: 1;
                    align-items: center;
                  `}
                >
                  <Button
                    onClick={() => setActive("general")}
                    variant={getButtonVariant("general")}
                    css={css`
                      margin: auto;
                    `}
                  >
                    General
                  </Button>
                  <Button
                    onClick={() => setActive("progression")}
                    variant={getButtonVariant("progression")}
                    css={css`
                      margin: auto;
                    `}
                  >
                    Progression
                  </Button>
                  <Button
                    onClick={() => setActive("matchups")}
                    variant={getButtonVariant("matchups")}
                    css={css`
                      margin: auto;
                    `}
                  >
                    Matchups
                  </Button>
                  <Button
                    onClick={() => setActive("interactions")}
                    variant={getButtonVariant("interactions")}
                    css={css`
                      margin: auto;
                    `}
                  >
                    Interactions
                  </Button>
                  <Button
                    onClick={() => setActive("random")}
                    variant={getButtonVariant("random")}
                    css={css`
                      margin: auto;
                    `}
                  >
                    Random
                  </Button>
                </div>
              </StatSection>
              {activeView == "general" ? (
                <GeneralStats player={"EAST#312"!} stats={stats}></GeneralStats>
              ) : activeView == "progression" ? (
                <ProgressionStats player={"EAST#312"!} stats={stats}></ProgressionStats>
              ) : null}
            </div>
          </>
        )}
      </Content>
    </Outer>
  );
};
