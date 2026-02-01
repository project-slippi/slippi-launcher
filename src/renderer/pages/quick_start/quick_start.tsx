import styled from "@emotion/styled";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import React from "react";
import { useNavigate } from "react-router-dom";

import { Dropdown } from "@/components/form/dropdown";
import { useAppStore } from "@/lib/hooks/use_app_store";
import { useMousetrap } from "@/lib/hooks/use_mousetrap";
import { useServices } from "@/services";
import { SUPPORTED_LANGUAGES } from "@/services/i18n/util";
import { platformTitleBarStyles } from "@/styles/platform_title_bar_styles";

import { QuickStartMessages as Messages } from "./quick_start.messages";
import { StepperDots } from "./stepper_dots/stepper_dots";
import { AcceptRulesStep } from "./steps/accept_rules_step/accept_rules_step";
import { ActivateOnlineStep } from "./steps/activate_online_step/activate_online_step";
import { IsoSelectionStep } from "./steps/iso_selection_step/iso_selection_step";
import { LoginStep } from "./steps/login_step";
import { SetupCompleteStep } from "./steps/setup_complete_step/setup_complete_step";
import { VerifyEmailStep } from "./steps/verify_email_step/verify_email_step";
import { QuickStartStep } from "./use_quick_start";

const OuterBox = styled(Box)`
  flex: 1;
  align-self: stretch;
  margin: 5% 10%;
  ${() => platformTitleBarStyles(0)}
`;

function getStepHeader(step: QuickStartStep): string {
  switch (step) {
    case QuickStartStep.COMPLETE:
      return Messages.youAreAllSetUp();
    default:
      return Messages.letsGetSetUp();
  }
}

const getStepContent = (step: QuickStartStep | undefined) => {
  switch (step) {
    case QuickStartStep.LOGIN:
      return <LoginStep />;
    case QuickStartStep.VERIFY_EMAIL:
      return <VerifyEmailStep />;
    case QuickStartStep.ACCEPT_RULES:
      return <AcceptRulesStep />;
    case QuickStartStep.ACTIVATE_ONLINE:
      return <ActivateOnlineStep />;
    case QuickStartStep.SET_ISO_PATH:
      return <IsoSelectionStep />;
    case QuickStartStep.COMPLETE:
      return <SetupCompleteStep />;
    default:
      return undefined;
  }
};

type QuickStartProps = {
  allSteps: QuickStartStep[];
  currentStep?: QuickStartStep;
  onNext?: () => void;
  onPrev?: () => void;
};

const sortedSupportedLanguages = [...SUPPORTED_LANGUAGES].sort((a, b) => a.label.localeCompare(b.label));

const LanguageSelectorDropdown = () => {
  const { i18nService } = useServices();
  const currentLanguage = useAppStore((state) => state.currentLanguage);

  const handleLanguageChange = React.useCallback(
    (language: string) => {
      void i18nService.setLanguage(language);
    },
    [i18nService],
  );
  return <Dropdown value={currentLanguage} options={sortedSupportedLanguages} onChange={handleLanguageChange} />;
};

export const QuickStart = ({ allSteps: steps, currentStep, onNext, onPrev }: QuickStartProps) => {
  const navigate = useNavigate();

  const skipSetup = () => navigate("/main");

  useMousetrap("escape", skipSetup);

  if (currentStep == null) {
    return null;
  }

  return (
    <OuterBox display="flex" flexDirection="column">
      <div
        style={{
          display: "flex",
          justifyContent: "end",
          visibility: currentStep === QuickStartStep.COMPLETE ? "hidden" : "visible",
        }}
      >
        <Button onClick={skipSetup} style={{ color: "#777", textTransform: "uppercase" }} size="small">
          {Messages.skipSetup()}
        </Button>
      </div>
      <Box display="flex" justifyContent="space-between" marginBottom="20px" alignItems="center">
        <Typography variant="h3">{getStepHeader(currentStep)}</Typography>
        <div style={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
          <LanguageSelectorDropdown />
        </div>
      </Box>
      <Box display="flex" flex="1" alignSelf="stretch" paddingTop="20px">
        {getStepContent(currentStep)}
      </Box>
      {steps.length > 1 && (
        <StepperDots
          steps={steps.length}
          activeStep={steps.indexOf(currentStep)}
          handleNext={onNext}
          handleBack={onPrev}
        />
      )}
    </OuterBox>
  );
};
