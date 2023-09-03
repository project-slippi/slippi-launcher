import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardHeader from "@mui/material/CardHeader";
import React from "react";

import { ExternalLink } from "@/components/ExternalLink";
import { ReactComponent as StartggLogo } from "@/styles/images/startgg-logo.svg";

const NearMeUrl =
  "https://www.start.gg/search/near_me" +
  "?range%5BeffectiveRegistrationClosesAt%5D%5Bmin%5D=1" +
  "&refinementList%5Bevents.videogame.id%5D=1" +
  "&refinementList%5BhasOnlineEvents%5D=" +
  "&refinementList%5Bstate%5D%5B0%5D=1" +
  "&page=1" +
  "&configure%5BhitsPerPage%5D=15" +
  "&configure%5Bfilters%5D=profileType%3Atournament" +
  "&configure%5BaroundLatLngViaIP%5D=true" +
  "&configure%5BaroundRadius%5D=160934";

const OnlineUrl =
  "https://www.start.gg/search/tournaments" +
  "?refinementList%5Bevents.videogame.id%5D=1" +
  "&refinementList%5BhasOnlineEvents%5D%5B0%5D=true" +
  "&page=1" +
  "&configure%5BhitsPerPage%5D=15" +
  "&configure%5Bfilters%5D=profileType%3Atournament" +
  "&range%5BeffectiveRegistrationClosesAt%5D%5Bmin%5D=1";

export const StartggLinks = React.memo(function StartggLinks() {
  return (
    <Card style={{ margin: "20px" }}>
      <CardHeader
        avatar={
          <StartggLogo height="40px" width="40px" viewBox="0 0 1001 1001" aria-label="start.gg logo" role="image" />
        }
        title="Tournaments"
        titleTypographyProps={{ component: "h2", variant: "h5" }}
      />
      <CardActions>
        <Button LinkComponent={ExternalLink} size="small" color="primary" href={NearMeUrl}>
          Nearby
        </Button>
        <Button LinkComponent={ExternalLink} size="small" color="primary" href={OnlineUrl}>
          Online
        </Button>
      </CardActions>
    </Card>
  );
});
