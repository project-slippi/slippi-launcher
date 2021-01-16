import Box from "@material-ui/core/Box";
import React from "react";
import styled from "styled-components";

import { QuickStart } from "@/containers/QuickStart";
import { useApp } from "@/store/app";
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
  const user = useApp((store) => store.user);
  return (
    <OuterBox display="flex" style={{ height: "100%", width: "100%" }}>
      <QuickStart user={user} />
    </OuterBox>
  );
};
