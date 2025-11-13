import { css } from "@emotion/react";
import styled from "@emotion/styled";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import React from "react";
import { useNavigate } from "react-router-dom";

import { QuickStartHeader } from "../../quick_start_header/quick_start_header";
import { SetupCompleteStepMessages as Messages } from "./setup_complete_step.messages";

const Container = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 800px;
`;

export const SetupCompleteStep = React.memo(() => {
  const navigate = useNavigate();
  const onClick = () => {
    navigate("/main");
  };
  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <Container>
        <QuickStartHeader>{Messages.niceWork()}</QuickStartHeader>
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
            {Messages.continue()}
          </Button>
        </div>
      </Container>
    </Box>
  );
});
