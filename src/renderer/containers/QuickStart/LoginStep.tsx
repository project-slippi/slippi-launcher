import styled from "@emotion/styled";
import Box from "@material-ui/core/Box";
import React from "react";

import { LoginForm } from "../LoginForm";
import { QuickStartHeader } from "./QuickStartHeader";

const FormContainer = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 800px;
`;

export const LoginStep: React.FC = () => {
  const [isSignUp, setIsSignUp] = React.useState(false);
  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <FormContainer>
        <QuickStartHeader>{isSignUp ? "Create an account" : "Login"}</QuickStartHeader>
        <LoginForm disableAutoFocus={true} isSignUp={isSignUp} toggleSignUp={() => setIsSignUp(!isSignUp)} />
      </FormContainer>
    </Box>
  );
};
