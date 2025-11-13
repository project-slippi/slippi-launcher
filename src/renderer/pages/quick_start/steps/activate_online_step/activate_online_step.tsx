import styled from "@emotion/styled";
import Box from "@mui/material/Box";
import React from "react";

import { ActivateOnlineForm } from "@/components/activate_online_form/activate_online_form";

import { QuickStartHeader } from "../../quick_start_header/quick_start_header";
import { ActivateOnlineStepMessages as Messages } from "./activate_online_step.messages";

const Container = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 800px;
`;

export const ActivateOnlineStep = React.memo(() => {
  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <Container>
        <QuickStartHeader>{Messages.chooseAConnectCode()}</QuickStartHeader>
        <ActivateOnlineForm />
      </Container>
    </Box>
  );
});
