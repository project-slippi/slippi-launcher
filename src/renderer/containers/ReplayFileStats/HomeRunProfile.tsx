import { IconMessage } from "@/components/Message";
import Warning from "@material-ui/icons/Warning";
import { FileResult } from "@replays/types";
import { StatsType } from "@slippi/slippi-js";
import _ from "lodash";
import React from "react";

export interface GameProfileProps {
  file: FileResult;
  stats: StatsType;
}

const StatSection: React.FC<{
  title: string;
}> = () => {
  return <IconMessage Icon={Warning} label="🛠 This page is under construction" />;
};

export const HomeRunProfile: React.FC<GameProfileProps> = () => {
  return (
    <div style={{ flex: "1", margin: 20 }}>
      <StatSection title="Home Run"></StatSection>
    </div>
  );
};
