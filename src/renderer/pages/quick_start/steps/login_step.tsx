import { LoginForm } from "@/components/login_form/login_form";

import { StepContainer } from "../step_container";

export const LoginStep = () => {
  return (
    <StepContainer>
      <LoginForm disableAutoFocus={true} />
    </StepContainer>
  );
};
