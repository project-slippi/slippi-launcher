import React from "react";

import { PlayerDisplay } from "../common/player_display";
import * as T from "../table_components";
import type { PlayerDisplayInfo, StatSection } from "../types";

type Props = {
  players: [PlayerDisplayInfo, PlayerDisplayInfo];
  sections: StatSection[];
};

export const OverallTable = ({ players, sections }: Props) => (
  <T.Table>
    <thead>
      <T.TableRow>
        <T.TableHeaderCell />
        {players.map((p) => (
          <T.TableHeaderCell key={p.name}>
            <PlayerDisplay info={p} />
          </T.TableHeaderCell>
        ))}
      </T.TableRow>
    </thead>
    {sections.map((section) => (
      <React.Fragment key={section.title}>
        <thead>
          <tr>
            <T.TableSubHeaderCell colSpan={3}>{section.title}</T.TableSubHeaderCell>
          </tr>
        </thead>
        <tbody>
          {section.rows.map((row) => (
            <T.TableRow key={row.label}>
              <T.TableCell>{row.label}</T.TableCell>
              <T.TableCell highlight={row.player.highlight}>{row.player.value}</T.TableCell>
              <T.TableCell highlight={row.opp.highlight}>{row.opp.value}</T.TableCell>
            </T.TableRow>
          ))}
        </tbody>
      </React.Fragment>
    ))}
  </T.Table>
);
