import styled from "@emotion/styled";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import React from "react";
import { Link } from "react-router-dom";

import { NotFoundPageMessages as Messages } from "./not_found_page.messages";

const OuterBox = styled(Box)`
  flex: 1;
  align-self: stretch;
  padding: 5% 10%;
`;

const Text = styled.h2`
  font-weight: normal;
  margin: 0;
`;

export const NotFoundPage = React.memo(() => {
  return (
    <OuterBox>
      <Typography variant="h2">{Messages.uhOh()}</Typography>
      <Text>{Messages.somethingWentWrong()}</Text>
      <div style={{ textAlign: "right" }}>
        <Button color="primary" variant="contained" component={Link} to="/main">
          {Messages.returnHome()}
        </Button>
      </div>
    </OuterBox>
  );
});
