import Box from "@material-ui/core/Box";
import React from "react";
import { LoginForm } from "../LoginForm";
import { QuickStartHeader } from "./QuickStartHeader";

export const LoginStep: React.FC = () => {
  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <QuickStartHeader>Log in with Slippi.gg</QuickStartHeader>
      <div style={{ textAlign: "center" }}>
        <LoginForm />
      </div>
    </Box>
  );
};
