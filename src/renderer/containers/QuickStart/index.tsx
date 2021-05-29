import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import firebase from "firebase";
import React from "react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";

import { StepperDots } from "@/components/StepperDots";
import { useSettings } from "@/lib/hooks/useSettings";

import { IsoSelectionStep } from "./IsoSelectionStep";
import { LoginStep } from "./LoginStep";
import { SetupCompleteStep } from "./SetupCompleteStep";

const OuterBox = styled(Box)`
  flex: 1;
  align-self: stretch;
  padding: 5% 10%;
`;

enum QuickStartStep {
  LOGIN = "LOGIN",
  SET_ISO_PATH = "SET_ISO_PATH",
  COMPLETE = "COMPLETE",
}

function generateSteps(user: firebase.User | null, validIsoPath: boolean): QuickStartStep[] {
  const steps: QuickStartStep[] = [];
  if (!user) {
    steps.push(QuickStartStep.LOGIN);
  }
  if (!validIsoPath) {
    steps.push(QuickStartStep.SET_ISO_PATH);
  }

  steps.push(QuickStartStep.COMPLETE);
  return steps;
}

function getStepHeader(step: QuickStartStep): string {
  switch (step) {
    case QuickStartStep.COMPLETE:
      return "You're all set up";
    default:
      return "Let's get set up";
  }
}

const getStepContent = (step: QuickStartStep | null) => {
  switch (step) {
    case QuickStartStep.LOGIN:
      return <LoginStep />;
    case QuickStartStep.SET_ISO_PATH:
      return <IsoSelectionStep />;
    case QuickStartStep.COMPLETE:
      return <SetupCompleteStep />;
    default:
      return null;
  }
};

export const QuickStart: React.FC<{
  user: firebase.User | null;
}> = ({ user }) => {
  const savedIsoPath = useSettings((store) => store.settings.isoPath);
  const isoIsValid = true; //useSettings((store) => store.validIsoPath);
  const skipIsoPage = savedIsoPath !== null && Boolean(isoIsValid);
  const history = useHistory();
  // We only want to generate the steps list once so use a React state
  const [steps] = React.useState(generateSteps(user, skipIsoPage));
  const [currentStep, setCurrentStep] = React.useState<QuickStartStep | null>(null);

  React.useEffect(() => {
    // If we only have the complete step then just go home
    if (steps.length === 1 && steps[0] === QuickStartStep.COMPLETE) {
      history.push("/home");
      return;
    }

    let stepToShow: QuickStartStep | null = QuickStartStep.COMPLETE;
    if (!skipIsoPage) {
      stepToShow = QuickStartStep.SET_ISO_PATH;
    }

    if (!user) {
      stepToShow = QuickStartStep.LOGIN;
    }
    setCurrentStep(stepToShow);
  }, [user, skipIsoPage]);

  if (currentStep === null) {
    return null;
  }

  return (
    <OuterBox display="flex" flexDirection="column">
      <Box display="flex" justifyContent="space-between" marginBottom="20px">
        <Typography variant="h2">{getStepHeader(currentStep)}</Typography>
        {currentStep !== QuickStartStep.COMPLETE && (
          <div>
            <Button onClick={() => history.push("/home")} style={{ color: "white" }}>
              Skip setup
            </Button>
          </div>
        )}
      </Box>
      <Box display="flex" flex="1" alignSelf="stretch">
        {getStepContent(currentStep)}
      </Box>
      <StepperDots steps={steps.length} activeStep={steps.indexOf(currentStep)} />
    </OuterBox>
  );
};
