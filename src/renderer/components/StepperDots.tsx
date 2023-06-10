import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import Button from "@mui/material/Button";
import MobileStepper from "@mui/material/MobileStepper";

export const StepperDots = ({
  steps,
  activeStep,
  handleNext,
  handleBack,
}: {
  steps: number;
  activeStep: number;
  handleNext?: () => void;
  handleBack?: () => void;
}) => {
  return (
    <MobileStepper
      sx={{
        background: "transparent",
        border: "none",
        padding: "0",
        marginTop: "25px",
        "& .MuiMobileStepper-dots": {
          margin: "auto auto",
        },
      }}
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
