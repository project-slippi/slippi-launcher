import Button from "@material-ui/core/Button";
import MobileStepper from "@material-ui/core/MobileStepper";
import { withStyles } from "@material-ui/core/styles";
import KeyboardArrowLeft from "@material-ui/icons/KeyboardArrowLeft";
import KeyboardArrowRight from "@material-ui/icons/KeyboardArrowRight";
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
  handleNext?: () => void;
  handleBack?: () => void;
}> = ({ steps, activeStep, handleNext, handleBack }) => {
  return (
    <StyledStepper
      variant="dots"
      steps={steps}
      position="static"
      activeStep={activeStep}
      nextButton={
        handleBack ? (
          <Button size="small" onClick={handleNext} disabled={activeStep === steps - 1}>
            Next
            <KeyboardArrowRight />
          </Button>
        ) : null
      }
      backButton={
        handleBack ? (
          <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
            <KeyboardArrowLeft />
            Back
          </Button>
        ) : null
      }
    />
  );
};
