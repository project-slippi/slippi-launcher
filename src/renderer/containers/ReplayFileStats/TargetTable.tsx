/** @jsx jsx */
import { jsx } from "@emotion/react";
import { FileResult } from "@replays/types";
import { PlayerType, StatsType, frameToGameTimer } from "@slippi/slippi-js";
import TrackChangesIcon from "@material-ui/icons/TrackChanges";
import CancelIcon from "@material-ui/icons/Cancel";
import _ from "lodash";
import React from "react";

import styled from "@emotion/styled";

export interface TargetTableProps {
  file: FileResult;
  stats: StatsType;
  player: PlayerType;
}

export const TargetTable: React.FC<TargetTableProps> = ({ file, stats }) => {
  const replayLength = file.metadata?.lastFrame as number;

  const renderTimeline = () => {
    const TargetIconStyle = styled.div``;

    const targetMarkers = stats.targetBreaks
      ?.filter((t) => t.frameDestroyed)
      .sort((a, b) => (a.frameDestroyed ?? replayLength + 1) - (b.frameDestroyed ?? replayLength + 1))
      .map((t) => {
        const percent = ((t.frameDestroyed ?? 0) / (replayLength * 1.0)) * 100;

        //top: ${10 * t.spawnId}px;
        const TargetStyle = styled.div`
          position: absolute;
          left: ${percent}%;
        `;

        return (
          <TargetStyle key={t.spawnId}>
            <TargetIconStyle>
              <TrackChangesIcon />
            </TargetIconStyle>
          </TargetStyle>
        );
      }) as React.ReactElement[];

    const LeftoverIndicator = styled.div`
      position: absolute;
      right: 0;
      padding-right: 10px;
    `;

    const LeftoverIcon = styled.div`
      color: #ff0000;
    `;

    // position on the bottom, centered
    const LeftoverCounter = styled.div`
      justify-content: center;
      align-items: bottom;
      display: flex;
    `;

    const leftoverCount = stats.targetBreaks?.filter((t) => !t.frameDestroyed).length ?? 0;

    const leftoverTargets = (
      <LeftoverIndicator>
        <LeftoverIcon>
          <CancelIcon />
        </LeftoverIcon>
        <LeftoverCounter>{leftoverCount}</LeftoverCounter>
      </LeftoverIndicator>
    ) as React.ReactElement;

    const Timeline = styled.div`
      width: 100%;
      opacity: 0.5;
    `;

    const TimelineLine = styled.div`
      border: 1px solid grey;
      width: 100%;
      border-radius: 5px;
    `;

    const TimelineNotch = styled.div`
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      border: 1px solid grey;
      border-radius: 1px;
    `;

    const notches = [] as React.ReactElement[];

    const orderOfMagnitude = Math.floor(Math.log(replayLength));

    // 30-second replays have a resolution of 1 second
    const resolution = replayLength < 60 * 30 + 123 ? 1 : orderOfMagnitude;

    console.log(`order of magnitude: ${orderOfMagnitude}`);
    console.log(`granularity: ${resolution}`);

    for (let i = 0; i < replayLength; i++) {
      if ((i / resolution) % 60 === 0) {
        notches.push(
          <TimelineNotch
            key={i}
            style={{
              left: `${(i / replayLength) * 100}%`,
              height: "40%",
            }}
          />,
        );
      } else if ((i / resolution) % 30 === 0) {
        notches.push(
          <TimelineNotch
            key={i}
            style={{
              left: `${(i / replayLength) * 100}%`,
              height: "15%",
            }}
          />,
        );
      }
    }

    return (
      <TimelineContainer>
        <Timeline>
          <TimelineLine />
          {notches}
        </Timeline>
        {targetMarkers}
        {leftoverCount > 0 ? leftoverTargets : null}
      </TimelineContainer>
    );
  };

  const TimelineContainer = styled.div`
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    height: 100%;
    width: 100%;
  `;

  const Exterior = styled.div`
    background-color: #623296;
    margin-top: 15px;
    margin-bottom: 15px;
    padding: 10px;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    border: 1px solid black;
  `;

  const Interior = styled.div`
    background-color: #411256;
    border-radius: 10px;
    padding: 1%;
    display: flex;
    width: 100%;
    height: 80px;
    align-items: center;
    justify-content: center;
    position: relative;
    border: 1px solid black;
  `;

  return (
    <div>
      <Exterior>
        <Interior>{renderTimeline()}</Interior>
      </Exterior>
    </div>
  );
};
