import Box from "@mui/material/Box";
import React from "react";
import { Navigate } from "react-router-dom";

import { withSlippiBackground } from "@/styles/with_slippi_background";

import { QuickStart } from "./quick_start";
import { useQuickStart, useQuickStartStore } from "./use_quick_start";

const isDevelopment = window.electron.bootstrap.isDevelopment;

export function createQuickStartPage(): { Page: React.ComponentType } {
  const Page = () => {
    const steps = useQuickStartStore((store) => store.steps);
    const { currentStep, nextStep, prevStep } = useQuickStart();

    // We have no more steps, so just go to the main page
    if (steps.length === 0) {
      return <Navigate to="/main" replace={true} />;
    }

    return (
      <Box css={withSlippiBackground} display="flex" style={{ height: "100%", width: "100%" }}>
        <QuickStart
          allSteps={steps}
          currentStep={currentStep}
          onNext={isDevelopment ? nextStep : undefined}
          onPrev={isDevelopment ? prevStep : undefined}
        />
      </Box>
    );
  };

  return { Page };
}
