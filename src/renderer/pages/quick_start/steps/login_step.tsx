import styled from "@emotion/styled";
import Box from "@mui/material/Box";
import React from "react";

import { LoginForm } from "../../../containers/LoginForm";

const FormContainer = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 800px;
`;

export const LoginStep = React.memo(() => {
  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <FormContainer>
        <LoginForm disableAutoFocus={true} />
      </FormContainer>
    </Box>
  );
});
