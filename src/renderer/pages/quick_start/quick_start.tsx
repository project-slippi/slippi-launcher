import styled from "@emotion/styled";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";

import { StepperDots } from "@/components/stepper_dots";
import { useMousetrap } from "@/lib/hooks/use_mousetrap";
import { QuickStartStep } from "@/lib/hooks/use_quick_start";
import { platformTitleBarStyles } from "@/styles/platformTitleBarStyles";

import { AcceptRulesStep } from "./steps/accept_rules_step";
import { ActivateOnlineStep } from "./steps/activate_online_step";
import { ImportDolphinSettingsStep } from "./steps/import_dolphin_settings_step";
import { IsoSelectionStep } from "./steps/iso_selection_step";
import { LoginStep } from "./steps/login_step";
import { SetupCompleteStep } from "./steps/setup_complete_step";
import { VerifyEmailStep } from "./steps/verify_email_step";

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

type QuickStartProps = {
  allSteps: QuickStartStep[];
  currentStep: QuickStartStep | null;
  onNext?: () => void;
  onPrev?: () => void;
};

export const QuickStart = ({ allSteps: steps, currentStep, onNext, onPrev }: QuickStartProps) => {
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
