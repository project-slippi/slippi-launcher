/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import React from "react";
import { useNavigate } from "react-router-dom";

import { QuickStartHeader } from "./QuickStartHeader";

const Container = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 800px;
`;

export const SetupCompleteStep: React.FC = () => {
  const navigate = useNavigate();
  const onClick = () => {
    navigate("/main");
  };
  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <Container>
        <QuickStartHeader>Nice work!</QuickStartHeader>
        <div
          css={css`
            display: flex;
            flex-direction: column;
            margin-left: auto;
            margin-right: auto;
            margin-top: 50px;
            max-width: 400px;
          `}
        >
          <Button color="primary" variant="contained" onClick={onClick}>
            Continue
          </Button>
        </div>
      </Container>
    </Box>
  );
};
