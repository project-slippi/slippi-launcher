import Warning from "@mui/icons-material/Warning";
import type { FileResult } from "@replays/types";
import type { StatsType } from "@slippi/slippi-js";
import React from "react";

import { IconMessage } from "@/components/Message";

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
