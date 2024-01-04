import styled from "@emotion/styled";
import Box from "@mui/material/Box";
import React from "react";

import { ActivateOnlineForm } from "@/containers/activate_online_form";

import { QuickStartHeader } from "../quick_start_header/quick_start_header";

const Container = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 800px;
`;

export const ActivateOnlineStep = React.memo(() => {
  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <Container>
        <QuickStartHeader>Choose a connect code</QuickStartHeader>
        <ActivateOnlineForm />
      </Container>
    </Box>
  );
});
