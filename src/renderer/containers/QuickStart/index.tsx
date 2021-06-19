import styled from "@emotion/styled";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { useHistory } from "react-router-dom";

import { StepperDots } from "@/components/StepperDots";
import { useMousetrap } from "@/lib/hooks/useMousetrap";
import { QuickStartStep } from "@/lib/hooks/useQuickStart";

import { IsoSelectionStep } from "./IsoSelectionStep";
import { LoginStep } from "./LoginStep";
import { SetupCompleteStep } from "./SetupCompleteStep";

const OuterBox = styled(Box)`
  flex: 1;
  align-self: stretch;
  padding: 5% 10%;
`;

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
    case QuickStartStep.ACTIVATE_ONLINE:
      return <div>you need to activate online</div>;
    case QuickStartStep.SET_ISO_PATH:
      return <IsoSelectionStep />;
    case QuickStartStep.COMPLETE:
      return <SetupCompleteStep />;
    default:
      return null;
  }
};

export interface QuickStartProps {
  allSteps: QuickStartStep[];
  currentStep: QuickStartStep | null;
}

export const QuickStart: React.FC<QuickStartProps> = ({ allSteps: steps, currentStep }) => {
  const history = useHistory();

  const skipSetup = () => history.push("/main");

  useMousetrap("escape", skipSetup);

  if (currentStep === null) {
    return null;
  }

  return (
    <OuterBox display="flex" flexDirection="column">
      <Box display="flex" justifyContent="space-between" marginBottom="20px">
        <Typography variant="h2">{getStepHeader(currentStep)}</Typography>
        {currentStep !== QuickStartStep.COMPLETE && (
          <div>
            <Button onClick={skipSetup} style={{ color: "white" }}>
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
