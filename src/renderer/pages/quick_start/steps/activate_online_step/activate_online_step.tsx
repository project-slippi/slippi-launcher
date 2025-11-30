import { ActivateOnlineForm } from "@/components/activate_online_form/activate_online_form";

import { StepContainer } from "../../step_container";
import { ActivateOnlineStepMessages as Messages } from "./activate_online_step.messages";

export const ActivateOnlineStep = () => {
  return (
    <StepContainer header={Messages.chooseAConnectCode()}>
      <ActivateOnlineForm />
    </StepContainer>
  );
};
