import { withStyles } from "@material-ui/core";
import MobileStepper from "@material-ui/core/MobileStepper/MobileStepper";
import React from "react";

const StyledStepper = withStyles({
  root: {
    background: "transparent",
    padding: "0",
    marginTop: "25px",
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
