import Box from "@material-ui/core/Box";
import React from "react";
import styled from "styled-components";
import { LoginForm } from "../LoginForm";
import { QuickStartHeader } from "./QuickStartHeader";

const FormContainer = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 800px;
`;

export const LoginStep: React.FC = () => {
  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <FormContainer>
        <QuickStartHeader>Login</QuickStartHeader>
        <LoginForm />
      </FormContainer>
    </Box>
  );
};
