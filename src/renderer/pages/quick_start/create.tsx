import Box from "@mui/material/Box";
import React from "react";

import { useQuickStart } from "@/lib/hooks/useQuickStart";
import { withSlippiBackground } from "@/styles/withSlippiBackground";

import { QuickStart } from "./quick_start";

const isDevelopment = window.electron.bootstrap.isDevelopment;

export function createQuickStartPage(): { Page: React.ComponentType } {
  const Page = React.memo(() => {
    const { allSteps, currentStep, nextStep, prevStep } = useQuickStart();
    return (
      <Box css={withSlippiBackground} display="flex" style={{ height: "100%", width: "100%" }}>
        <QuickStart
          allSteps={allSteps}
          currentStep={currentStep}
          onNext={isDevelopment ? nextStep : undefined}
          onPrev={isDevelopment ? prevStep : undefined}
        />
      </Box>
    );
  });

  return { Page };
}
