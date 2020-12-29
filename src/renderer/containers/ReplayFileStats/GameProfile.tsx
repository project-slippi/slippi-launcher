import styled from "styled-components";
import React from "react";
import { colors } from "../../../common/colors";
import log from "electron-log";
import {
  convertFrameCountToDurationString,
  fileToDateAndTime,
} from "../../../common/time";
import { GameProfileHeader } from "./GameProfileHeader";
import { FileResult } from "../../../common/replayBrowser/types";
import _ from "lodash";
import { stages as stageUtils } from "@slippi/slippi-js";

export interface GameProfileProps {
  file: FileResult;
  index: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
}

const DetailLabel = styled.label`
  font-weight: bold;
  color: rgba(255, 255, 255, 0.5);
  margin-right: 4px;
  font-size: 14px;
`;

const DetailContent = styled.label`
  color: ${colors.offWhite};
  text-transform: capitalize;
  font-size: 14px;
`;

const PipeSpacer = styled.label`
  margin: 16px;
  width: 16px;
  border-right: solid 1px white;
`;

const StatsButton = styled.button`
  color: ${colors.offWhite};
  background-color: transparent;
  border-radius: 36px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  display: inline-block;
  cursor: pointer;
  padding: 2px 22px;
  margin: 6px 2px;
  text-align: center;
  line-height: 20px;
  outline: none;

  &:hover:enabled {
    background-color: ${colors.offWhite};
    color: ${colors.grayDark};
  }

  &:disabled {
    color: rgba(255, 255, 255, 0.2);
    cursor: default;
  }
`;

const TableTitle = styled.h2`
  font-weight: bold;
  color: rgba(255, 255, 255, 0.8);
  height: 100px;
`;

const HeaderDiv = styled.div`
  background-color: ${colors.foreground};
  box-shadow: 0px 20px 20px 0px rgba(0, 0, 0, 0.2);
  padding: 12px 0px;
  position: fixed;
  width: 100%;
  z-index: 2;
`;

const TableDiv = styled.div`
  background-color: ${colors.tableBackground};
  height: 100%;
  width: 100%;
  overflow: auto;
  position: fixed;
  top: 140px;
`;
export const GameProfile: React.FC<GameProfileProps> = ({
  file,
  index,
  total,
  onNext,
  onPrev,
}) => {
  const getTimeFromElsewhere = (): string => {
    const fileName = file.fullPath.split("\\").pop().split("/").pop();
    return fileToDateAndTime(
      file.metadata ? _.get(file.metadata, "startAt") : null,
      fileName,
      file.fullPath
    );
  };

  const renderGameDetails = () => {
    let stageName = "Unknown";
    try {
      stageName = stageUtils.getStageName(file.settings.stageId);
    } catch (err) {
      log.error(err);
    }

    const duration = _.get(file.metadata, "lastFrame");
    const durationDisplay = convertFrameCountToDurationString(duration);

    const platform = file.metadata.playedOn || "Unknown";

    const getTimeFromFile = new Date(
      file.startTime ? Date.parse(file.startTime) : 0
    );

    const startAtDisplay =
      getTimeFromFile || getTimeFromElsewhere() || "Unknown";

    const displayData = [
      {
        label: "Stage",
        content: stageName,
      },
      {
        label: "Duration",
        content: durationDisplay,
      },
      {
        label: "Time",
        content: startAtDisplay.toLocaleString(),
      },
      {
        label: "Platform",
        content: platform,
      },
    ];

    if (_.get(file.metadata, "playedOn")) {
      // TODO is this necessary?
      displayData.push({
        label: "Console Name",
        content: _.get(file.metadata, "playedOn"),
      });
    }

    const metadataElements = displayData.map((details, index) => {
      return (
        <div key={details.label} style={{ display: "inline-block" }}>
          {index ? <PipeSpacer /> : null}
          <DetailLabel>{details.label}</DetailLabel>
          <DetailContent>{details.content}</DetailContent>
        </div>
      );
    });

    return <div>{metadataElements}</div>;
  };

  const playFile = () => {
    console.log(":D");
  };

  const renderStatsControls = () => {
    return (
      <div style={{ margin: "15px" }}>
        <div>
          <StatsButton onClick={playFile}>
            <img
              src="images\play.png"
              style={{ height: "12px", marginRight: "5px" }}
            ></img>
            Launch Replay
          </StatsButton>
        </div>
        <StatsButton disabled={index === 0} onClick={onPrev}>
          Prev
        </StatsButton>
        <StatsButton disabled={index === total - 1} onClick={onNext}>
          Next
        </StatsButton>
      </div>
    );
  };

  const renderOverall = () => {
    return (
      <div style={{ margin: "140px 16px" }}>
        <TableTitle>Overall</TableTitle>
        {/* <OverallTable
          game={this.props.store.game}
          player1Display={this.renderPlayerColHeader(true)}
          player1Index={this.getPlayerIndex(true)}
          player2Display={this.renderPlayerColHeader(false)}
          player2Index={this.getPlayerIndex(false)}
        /> */}
      </div>
    );
  };
  return (
    <div>
      <div>
        <HeaderDiv>
          <div style={{ margin: "0px 16px" }}>
            <div style={{ display: "inline-block" }}>
              <GameProfileHeader
                metadata={file.metadata}
                settings={file.settings}
              />
            </div>
            <div style={{ display: "inline-block", float: "right" }}>
              {renderStatsControls()}
            </div>
            {renderGameDetails()}
          </div>
        </HeaderDiv>
      </div>
      <div style={{ margin: "0px" }}>
        <TableDiv>{renderOverall()}</TableDiv>
      </div>
    </div>
  );
};
