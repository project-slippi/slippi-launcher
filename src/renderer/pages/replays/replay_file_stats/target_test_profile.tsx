import Construction from "@mui/icons-material/Construction";
import type { FileResult } from "@replays/types";
import type { StadiumStatsType } from "@slippi/slippi-js";

import { IconMessage } from "@/components/message";

type GameProfileProps = {
  file: FileResult;
  stats?: StadiumStatsType;
};

const StatSection = (_props: { title: string }) => {
  return <IconMessage Icon={Construction} label="This page is under construction" />;
};

export const TargetTestProfile = (_props: GameProfileProps) => {
  return (
    <div style={{ flex: "1", margin: 20 }}>
      <StatSection title="Targets" />
    </div>
  );
};
