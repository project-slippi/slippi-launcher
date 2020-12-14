import { withStyles } from "@material-ui/core/styles";
import MobileStepper from "@material-ui/core/MobileStepper";
import { colors } from "common/colors";
import React from "react";

const StyledStepper = withStyles({
  root: {
    background: "transparent",
    border: "none",
    padding: "0",
    marginTop: "25px",
  },
  dotActive: {
    backgroundColor: colors.greenPrimary,
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
