import styled from "@emotion/styled";
import OpenInNew from "@mui/icons-material/OpenInNew";
import IconButton from "@mui/material/IconButton";
import React from "react";

import { ExternalLink } from "@/components/external_link";

import { PlayerBadge } from "./player_badge/player_badge";

const SLIPPI_PROFILE_URL_PREFIX = "https://slippi.gg/user";

const Outer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  & > div {
    margin-right: 8px;
  }
`;

export type PlayerInfo = React.ComponentProps<typeof PlayerBadge>;

type TeamElementProps = {
  teams: PlayerInfo[][];
};

export const TeamElements = ({ teams }: TeamElementProps) => {
  const elements: React.ReactNode[] = [];
  teams.forEach((team, i) => {
    team.forEach((player) => {
      elements.push(<PlayerBadge key={`player-${player.port}`} {...player} />);

      if (player.text.includes("#")) {
        const profileUrl = `${SLIPPI_PROFILE_URL_PREFIX}/${player.text.split("#").join("-")}`;
        elements.push(
          <IconButton
            key={`url-${player.text}`}
            color="secondary"
            size="small"
            style={{ position: "relative", left: "-8px", marginRight: "-8px" }}
            LinkComponent={ExternalLink}
            href={profileUrl}
            onClick={(e) => e.stopPropagation()}
          >
            <OpenInNew fontSize="small" />
          </IconButton>,
        );
      }
    });

    // Add VS obj in between teams
    if (i < teams.length - 1) {
      // If this is not the last team, add a "vs" element
      elements.push(
        <div key={`vs-${i}`} style={{ color: "rgba(255, 255, 255, 0.5)" }}>
          vs
        </div>,
      );
    }
  });
  return <Outer>{elements}</Outer>;
};
