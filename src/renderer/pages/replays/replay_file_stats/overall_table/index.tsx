import type { FileResult } from "@replays/types";
import type { StatsType } from "@slippi/slippi-js";

import * as T from "../table_components";
import { statSections } from "./stat_definitions";
import { renderPlayerHeaders, renderSection } from "./stat_renderers";

type OverallTableProps = {
  file: FileResult;
  stats: StatsType;
};

export const OverallTable = ({ file, stats }: OverallTableProps) => {
  return (
    <T.Table>
      {renderPlayerHeaders(file)}
      {statSections.map((section) => renderSection(section, stats))}
    </T.Table>
  );
};
