import { withStyles } from "@material-ui/core";
import MobileStepper from "@material-ui/core/MobileStepper/MobileStepper";
import React from "react";

const StyledStepper = withStyles({
  root: {
    // Why do I have to set it as important for this to work?! This is garbo!
    background: "transparent !important",
    padding: "0 !important",
  },
  dots: {
    margin: "auto auto",
  },
})(MobileStepper);

export const StepperDots: React.FC<{
  steps: number;
  activeStep: number;
}> = ({ steps, activeStep }) => {
  return (
    <StyledStepper
      variant="dots"
      steps={steps}
      position="static"
      activeStep={activeStep}
      nextButton={null}
      backButton={null}
    />
  );
};
