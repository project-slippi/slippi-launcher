import { css } from "@mui/material";
import React from "react";
import type { GlobalStats } from "stats/general";

import * as T from "@/containers/ReplayFileStats/TableStyles";

interface ThrowsTableProps {
  stats: GlobalStats;
}

const generatePunishRow = () => {
  return (
    <T.TableRow style={{ textAlign: "center" }} key={`${1}-${1}-punish-${1}`}>
      <T.TableCell>Hello</T.TableCell>
      <T.TableCell>Hello</T.TableCell>
      <T.TableCell>Hello</T.TableCell>
      <T.TableCell>Hello</T.TableCell>
    </T.TableRow>
  );
};

export const ThrowsTable: React.FC<ThrowsTableProps> = () => {
  return (
    <div
      css={css`
        margin-left: auto;
        margin-right: auto;
        margin-top: 50px;
      `}
    >
      <T.Table>
        <thead></thead>
        <tbody>
          {generatePunishRow()}
          {generatePunishRow()}
        </tbody>
      </T.Table>
    </div>
  );
};
