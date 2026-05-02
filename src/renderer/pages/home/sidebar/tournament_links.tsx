import LanguageIcon from "@mui/icons-material/Language";
import PeopleIcon from "@mui/icons-material/People";
import { Card, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import React from "react";

import { ExternalLink } from "@/components/external_link";
import { cssVar } from "@/styles/colors";

import { TournamentLinksMessages as Messages } from "./tournament_links.messages";
import styles from "./tournament_links.module.css";

const NEARBY_TOURNAMENTS_URL =
  "https://start.gg/search/near_me?refinementList%5Bevents.videogame.id%5D=1&refinementList%5BhasOnlineEvents%5D=&refinementList%5Bstate%5D%5B0%5D=1&page=1&configure%5BhitsPerPage%5D=15&configure%5Bfilters%5D=profileType%3Atournament&configure%5BaroundLatLngViaIP%5D=true&configure%5BaroundRadius%5D=160934";

const ONLINE_TOURNAMENTS_URL =
  "https://start.gg/search/tournaments?refinementList%5Bevents.videogame.id%5D=1&refinementList%5BhasOnlineEvents%5D%5B0%5D=true&page=1&configure%5BhitsPerPage%5D=15&configure%5Bfilters%5D=profileType%3Atournament&range%5BeffectiveRegistrationClosesAt%5D%5Bmin%5D=1";

export const TournamentLinks = React.memo(function TournamentLinks() {
  return (
    <Card className={styles.card}>
      <div className={styles.centerStack}>
        <Typography
          variant="h6"
          color={cssVar("purpleLight")}
          fontSize="14px"
          fontWeight="semibold"
          marginBottom="8px"
          textTransform="uppercase"
        >
          {Messages.findTournaments()}
        </Typography>
        <Button
          color="secondary"
          LinkComponent={ExternalLink}
          size="small"
          href={NEARBY_TOURNAMENTS_URL}
          startIcon={<PeopleIcon />}
          title={Messages.findInPersonTournaments()}
        >
          {Messages.inPerson()}
        </Button>
        <Button
          color="secondary"
          LinkComponent={ExternalLink}
          size="small"
          href={ONLINE_TOURNAMENTS_URL}
          startIcon={<LanguageIcon />}
          title={Messages.findOnlineTournaments()}
        >
          {Messages.online()}
        </Button>
      </div>
    </Card>
  );
});
