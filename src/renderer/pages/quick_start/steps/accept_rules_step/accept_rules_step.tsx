import { css } from "@emotion/react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useState } from "react";

import { SlippiOnlineRules } from "@/components/slippi_online_rules/slippi_online_rules";
import { SlippiUsagePolicyList } from "@/components/slippi_usage_policy_list/slippi_usage_policy_list";
import { refreshUserData } from "@/lib/hooks/use_account";
import { useToasts } from "@/lib/hooks/use_toasts";
import { useServices } from "@/services";

import { StepContainer } from "../../step_container";
import { AcceptRulesStepMessages as Messages } from "./accept_rules_step.messages";

export const AcceptRulesStep = () => {
  const { slippiBackendService } = useServices();
  const { showError } = useToasts();
  const [rulesChecked, setRulesChecked] = useState(false);
  const [policiesChecked, setPoliciesChecked] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleAcceptClick = async () => {
    setProcessing(true);

    try {
      await slippiBackendService.acceptRules();
      await refreshUserData(slippiBackendService);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <StepContainer header={Messages.acceptRulesAndPolicies()}>
      <SlippiOnlineRules />
      <FormControlLabel
        label={Messages.acceptSlippiRules()}
        control={
          <Checkbox
            checked={rulesChecked}
            disabled={processing}
            onChange={(_event, value) => setRulesChecked(value)}
            sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
          />
        }
      />
      <SlippiUsagePolicyList />
      <FormControlLabel
        label={Messages.acceptPrivacyPolicyAndTos()}
        control={
          <Checkbox
            checked={policiesChecked}
            disabled={processing}
            onChange={(_event, value) => setPoliciesChecked(value)}
            sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
          />
        }
      />
      <div>
        <Button
          css={css`
            margin-top: 32px;
            width: 150px;
            height: 54px;
          `}
          onClick={handleAcceptClick}
          variant="contained"
          disabled={!policiesChecked || !rulesChecked || processing}
          size="large"
        >
          {processing ? <CircularProgress color="inherit" size={24} /> : Messages.acceptAll()}
        </Button>
      </div>
    </StepContainer>
  );
};
