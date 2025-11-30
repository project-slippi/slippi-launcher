import { css } from "@emotion/react";
import Button from "@mui/material/Button";
import React from "react";
import { useNavigate } from "react-router-dom";

import { StepContainer } from "../../step_container";
import { SetupCompleteStepMessages as Messages } from "./setup_complete_step.messages";

export const SetupCompleteStep = () => {
  const navigate = useNavigate();
  const onClick = () => {
    navigate("/main");
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
