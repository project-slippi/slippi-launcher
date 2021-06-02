import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import React from "react";
import { useHistory } from "react-router-dom";

import { QuickStartHeader } from "./QuickStartHeader";

export const SetupCompleteStep: React.FC = () => {
  const history = useHistory();
  const onClick = () => {
    history.push("/main");
  };
  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <QuickStartHeader>Nice work!</QuickStartHeader>
      <div style={{ textAlign: "right" }}>
        <Button color="primary" variant="contained" onClick={onClick}>
          Continue
        </Button>
      </div>
    </Box>
  );
};
