import React from "react";
import { AppContext } from "@/store";
import { QuickStart } from "@/containers/QuickStart/QuickStart";
import Box from "@material-ui/core/Box";

export const LandingView: React.FC = () => {
  const { state } = React.useContext(AppContext);

  return (
    <Box display="flex" style={{ height: "100%", width: "100%" }}>
      <QuickStart user={state.user} />
    </Box>
  );
};
