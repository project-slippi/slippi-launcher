import styled from "@emotion/styled";
import LanguageIcon from "@mui/icons-material/Language";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Card, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import * as stylex from "@stylexjs/stylex";
import React from "react";

import { ExternalLink } from "@/components/external_link";
import { colors } from "@/styles/tokens.stylex";

import { TournamentLinksMessages as Messages } from "./tournament_links.messages";

const NEARBY_TOURNAMENTS_URL =
  "https://start.gg/search/near_me?refinementList%5Bevents.videogame.id%5D=1&refinementList%5BhasOnlineEvents%5D=&refinementList%5Bstate%5D%5B0%5D=1&page=1&configure%5BhitsPerPage%5D=15&configure%5Bfilters%5D=profileType%3Atournament&configure%5BaroundLatLngViaIP%5D=true&configure%5BaroundRadius%5D=160934";

const ONLINE_TOURNAMENTS_URL =
  "https://start.gg/search/tournaments?refinementList%5Bevents.videogame.id%5D=1&refinementList%5BhasOnlineEvents%5D%5B0%5D=true&page=1&configure%5BhitsPerPage%5D=15&configure%5Bfilters%5D=profileType%3Atournament&range%5BeffectiveRegistrationClosesAt%5D%5Bmin%5D=1";

const LinksGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-items: center;
  align-items: center;
`;

const styles = stylex.create({
  card: {
    margin: "6px",
    padding: "10px",
  },
  centerStack: {
    display: "grid",
    justifyContent: "center",
    justifyItems: "center",
    alignItems: "center",
  },
});

export const TournamentLinks = React.memo(function TournamentLinks() {
  return (
    <Card {...stylex.props(styles.card)}>
      <div {...stylex.props(styles.centerStack)}>
        <Typography
          variant="h6"
          color={colors.purpleLight}
          fontSize="14px"
          fontWeight="semibold"
          marginBottom="8px"
          textTransform="uppercase"
        >
          {Messages.tournaments()}
        </Typography>
        <LinksGrid>
          <Button
            color="secondary"
            LinkComponent={ExternalLink}
            size="small"
            href={NEARBY_TOURNAMENTS_URL}
            startIcon={<LocationOnIcon />}
            title={Messages.showNearbyTournamentsInBrowser()}
          >
            {Messages.nearby()}
          </Button>
          <Button
            color="secondary"
            LinkComponent={ExternalLink}
            size="small"
            href={ONLINE_TOURNAMENTS_URL}
            startIcon={<LanguageIcon />}
            title={Messages.showOnlineTournamentsInBrowser()}
          >
            {Messages.online()}
          </Button>
        </LinksGrid>
      </div>
    </Card>
  );
});
