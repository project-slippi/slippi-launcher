/** @jsx jsx */
import { jsx } from "@emotion/react";
import Box from "@material-ui/core/Box";
import React from "react";

import { QuickStart } from "@/containers/QuickStart";
import { useQuickStart } from "@/lib/hooks/useQuickStart";
import { withSlippiBackground } from "@/styles/withSlippiBackground";

export const LandingView: React.FC = () => {
  const { allSteps, currentStep } = useQuickStart();
  return (
    <Box css={withSlippiBackground} display="flex" style={{ height: "100%", width: "100%" }}>
      <QuickStart allSteps={allSteps} currentStep={currentStep} />
    </Box>
  );
};
