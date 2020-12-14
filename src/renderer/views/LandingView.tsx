import styled from "styled-components";
import React from "react";
import { AppContext } from "@/store";
import { QuickStart } from "@/containers/QuickStart/QuickStart";
import Box from "@material-ui/core/Box";

import slippiLogo from "@/styles/images/slippi-logo.svg";

const OuterBox = styled(Box)`
  position: relative;
  &::before {
    content: "";
    background-image: url("${slippiLogo}");
    background-size: 50%;
    background-position: 110% 120%;
    background-repeat: no-repeat;
    position: absolute;
    top: 0;
    height: 100%;
    width: 100%;
    opacity: 0.2;
    z-index: -1;
  }
`;

export const LandingView: React.FC = () => {
  const { state } = React.useContext(AppContext);

  return (
    <OuterBox display="flex" style={{ height: "100%", width: "100%" }}>
      <QuickStart user={state.user} />
    </OuterBox>
  );
};
