import styled from "@emotion/styled";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LanguageIcon from "@mui/icons-material/Language";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Typography } from "@mui/material";
import Button from "@mui/material/Button";
import React from "react";

import { ExternalLink } from "@/components/ExternalLink";
import { ReactComponent as StartggLogo } from "@/styles/images/startgg-logo.svg";

const NEARBY_TOURNAMENTS_URL =
  "https://start.gg/search/near_me?range%5BeffectiveRegistrationClosesAt%5D%5Bmin%5D=1&refinementList%5Bevents.videogame.id%5D=1&refinementList%5BhasOnlineEvents%5D=&refinementList%5Bstate%5D%5B0%5D=1&page=1&configure%5BhitsPerPage%5D=15&configure%5Bfilters%5D=profileType%3Atournament&configure%5BaroundLatLngViaIP%5D=true&configure%5BaroundRadius%5D=160934";

const ONLINE_TOURNAMENTS_URL =
  "https://start.gg/search/tournaments?refinementList%5Bevents.videogame.id%5D=1&refinementList%5BhasOnlineEvents%5D%5B0%5D=true&page=1&configure%5BhitsPerPage%5D=15&configure%5Bfilters%5D=profileType%3Atournament&range%5BeffectiveRegistrationClosesAt%5D%5Bmin%5D=1";

const PoweredByContainer = styled.div`
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: end;
  align-items: center;
  padding: 4px 10px;
  font-size: 9pt;
  color: rgba(255, 255, 255, 0.6);
`;

const LinksContainer = styled.div`
  background-color: rgba(0, 0, 0, 0.35);
  padding: 15px;
`;

const LinksGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-items: center;
  align-items: center;
`;

export const StartggLinks = React.memo(function StartggLinks() {
  return (
    <div>
      <LinksContainer>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Typography variant="h2" fontSize={18} marginLeft={0.5}>
            Tournaments
          </Typography>
          <EmojiEventsIcon fontSize="small" />
        </div>
        <LinksGrid>
          <Button
            color="secondary"
            LinkComponent={ExternalLink}
            size="small"
            href={NEARBY_TOURNAMENTS_URL}
            startIcon={<LocationOnIcon />}
            title="Show nearby tournaments in the browser"
          >
            Nearby
          </Button>
          <Button
            color="secondary"
            LinkComponent={ExternalLink}
            size="small"
            href={ONLINE_TOURNAMENTS_URL}
            startIcon={<LanguageIcon />}
            title="Show online tournaments in the browser"
          >
            Online
          </Button>
        </LinksGrid>
      </LinksContainer>
      <PoweredByContainer>
        <div style={{ marginRight: 5 }}>powered by start.gg</div>
        <StartggLogo height="16px" width="16px" viewBox="0 0 1001 1001" aria-label="start.gg logo" role="image" />
      </PoweredByContainer>
    </div>
  );
});
