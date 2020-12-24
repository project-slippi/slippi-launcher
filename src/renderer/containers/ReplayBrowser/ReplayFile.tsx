import _ from "lodash";

import React from "react";
import { FileResult } from "common/replayBrowser";
import { getCharacterIcon } from "@/lib/utils";

export const ReplayFile: React.FC<FileResult> = (props) => {
  const { settings, fullPath } = props;
  if (!settings) {
    return <div>Error rendering {fullPath}. Settings is null.</div>;
  }

  // If this is a teams game, group by teamId, otherwise group players individually
  const teams = _.chain(settings.players)
    .groupBy((player) => (settings.isTeams ? player.teamId : player.port))
    .toArray()
    .value();
  return (
    <div>
      <div>{props.name}</div>{" "}
      <div style={{ display: "flex" }}>
        {teams.flatMap((team) =>
          team.map((player) => (
            <div>
              <img
                style={{ width: 20 }}
                src={getCharacterIcon(
                  player.characterId ?? 0,
                  player.characterColor ?? 0
                )}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
