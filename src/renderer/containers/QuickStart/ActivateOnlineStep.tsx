import styled from "@emotion/styled";
import Box from "@material-ui/core/Box";
import React from "react";

import { ActivateOnlineForm } from "../ActivateOnlineForm";
import { QuickStartHeader } from "./QuickStartHeader";

const Container = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 800px;
`;

export const ActivateOnlineStep: React.FC = () => {
  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <Container>
        <QuickStartHeader>Enable Online Play</QuickStartHeader>
        <ActivateOnlineForm />
      </Container>
    </Box>
  );
};
