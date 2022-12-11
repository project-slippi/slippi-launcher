import styled from "@emotion/styled";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import React from "react";
import { useNavigate } from "react-router-dom";

import { StepperDots } from "@/components/StepperDots";
import { useMousetrap } from "@/lib/hooks/useMousetrap";
import { QuickStartStep } from "@/lib/hooks/useQuickStart";
import { platformTitleBarStyles } from "@/styles/platformTitleBarStyles";

import { AcceptRulesStep } from "./AcceptRulesStep";
import { ActivateOnlineStep } from "./ActivateOnlineStep";
import { ImportDolphinSettingsStep } from "./ImportDolphinSettingsStep";
import { IsoSelectionStep } from "./IsoSelectionStep";
import { LoginStep } from "./LoginStep";
import { SetupCompleteStep } from "./SetupCompleteStep";
import { VerifyEmailStep } from "./VerifyEmailStep";

const OuterBox = styled(Box)`
  flex: 1;
  align-self: stretch;
  padding: 5% 10%;
  ${() => platformTitleBarStyles(0)}
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
    case QuickStartStep.VERIFY_EMAIL:
      return <VerifyEmailStep />;
    case QuickStartStep.ACCEPT_RULES:
      return <AcceptRulesStep />;
    case QuickStartStep.ACTIVATE_ONLINE:
      return <ActivateOnlineStep />;
    case QuickStartStep.MIGRATE_DOLPHIN:
      return <ImportDolphinSettingsStep />;
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
  onNext?: () => void;
  onPrev?: () => void;
}

export const QuickStart: React.FC<QuickStartProps> = ({ allSteps: steps, currentStep, onNext, onPrev }) => {
  const navigate = useNavigate();

  const skipSetup = () => navigate("/main");

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
            <Button onClick={skipSetup} style={{ color: "white", textTransform: "uppercase" }}>
              Skip setup
            </Button>
          </div>
        )}
      </Box>
      <Box display="flex" flex="1" alignSelf="stretch" paddingTop="40px">
        {getStepContent(currentStep)}
      </Box>
      <StepperDots
        steps={steps.length}
        activeStep={steps.indexOf(currentStep)}
        handleNext={onNext}
        handleBack={onPrev}
      />
    </OuterBox>
  );
};
