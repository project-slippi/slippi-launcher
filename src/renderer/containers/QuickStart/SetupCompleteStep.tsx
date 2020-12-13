import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import { withStyles } from "@material-ui/core/styles";
import React from "react";
import { useHistory } from "react-router-dom";
import { QuickStartHeader } from "./QuickStartHeader";

const WhiteButton = withStyles(() => ({
  root: {
    color: "#ffffff",
    borderColor: "#ffffff",
    textTransform: "none",
  },
}))(Button);

export const SetupCompleteStep: React.FC = () => {
  const history = useHistory();
  const onClick = () => {
    history.push("/home");
  };
  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <QuickStartHeader>You're all set up!</QuickStartHeader>
      <div style={{ textAlign: "center" }}>
        <WhiteButton variant="outlined" onClick={onClick}>
          Continue
        </WhiteButton>
      </div>
    </Box>
  );
};
