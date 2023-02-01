import Construction from "@mui/icons-material/Construction";
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
  return <IconMessage Icon={Construction} label="This page is under construction" />;
};

export const HomeRunProfile: React.FC<GameProfileProps> = () => {
  return (
    <div style={{ flex: "1", margin: 20 }}>
      <StatSection title="Home Run"></StatSection>
    </div>
  );
};
