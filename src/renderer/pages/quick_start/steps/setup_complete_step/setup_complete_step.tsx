import { css } from "@emotion/react";
import Button from "@mui/material/Button";

import { useQuickStartStore } from "@/lib/hooks/use_quick_start";

import { StepContainer } from "../../step_container";
import { SetupCompleteStepMessages as Messages } from "./setup_complete_step.messages";

export const SetupCompleteStep = () => {
  const setSteps = useQuickStartStore((store) => store.setSteps);
  const onClick = () => {
    // Clear the quick start steps since we don't need them anymore
    setSteps([]);
  };

  return (
    <StepContainer header={Messages.niceWork()}>
      <div
        css={css`
          display: flex;
          flex-direction: column;
          margin-left: auto;
          margin-right: auto;
          margin-top: 50px;
          max-width: 400px;
        `}
      >
        <Button color="primary" variant="contained" onClick={onClick}>
          {Messages.continue()}
        </Button>
      </div>
    </StepContainer>
  );
};
