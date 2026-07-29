import { VerifyEmailForm } from "@/components/verify_email_form/verify_email_form";

import { StepContainer } from "../../step_container";
import { VerifyEmailStepMessages as Messages } from "./verify_email_step.messages";

export const VerifyEmailStep = () => {
  return (
    <StepContainer header={Messages.verifyYourEmail()}>
      <VerifyEmailForm />
    </StepContainer>
  );
};
