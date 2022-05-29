import styled from "@emotion/styled";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import React from "react";
import { Link } from "react-router-dom";

const OuterBox = styled(Box)`
  flex: 1;
  align-self: stretch;
  padding: 5% 10%;
`;

const Text = styled.h2`
  font-weight: normal;
  margin: 0;
`;

export const NotFoundView: React.FC = () => {
  return (
    <OuterBox>
      <Typography variant="h2">Uh oh.</Typography>
      <Text>Something went wrong.</Text>
      <div style={{ textAlign: "right" }}>
        <Button color="primary" variant="contained" component={Link} to="/main">
          Return home
        </Button>
      </div>
    </OuterBox>
  );
};
