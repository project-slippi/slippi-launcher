import { css } from "@emotion/react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";

import { ExternalLink as A } from "@/components/external_link";
import { refreshUserData, useAccount } from "@/lib/hooks/use_account";
import { useToasts } from "@/lib/hooks/use_toasts";
import { useServices } from "@/services";
import { colors } from "@/styles/colors";

import { StepContainer } from "../../step_container";
import { AcceptRulesStepMessages as Messages } from "./accept_rules_step.messages";

const classes = {
  sectionHeader: css`
    margin-top: 32px;
    margin-bottom: 12px;
    font-weight: bold;
  `,
  rulesContainer: css`
    color: ${colors.textSecondary};
    padding: 8px;
    background-color: #00000040;
    border-radius: 8px;
    margin-bottom: 12px;
  `,
  rulesList: css`
    margin-left: 8px;
    margin-top: 8px;
    display: grid;
    grid-template-columns: auto 1fr;
    grid-gap: 8px;
    gap: 8px;
  `,
  policiesList: css`
    margin-left: 16px;
    margin-top: 8px;
    margin-bottom: 8px;
    display: grid;
    grid-template-columns: auto 1fr;
    grid-gap: 8px 14px;
    gap: 8px 14px;
  `,
  button: css`
    margin-top: 32px;
    width: 150px;
    height: 54px;
  `,
  link: css`
    color: #b984bb;
  `,
};

export const AcceptRulesStep = () => {
  const { slippiBackendService } = useServices();
  const { showError } = useToasts();
  const user = useAccount((store) => store.user);
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

  // TODO: Only show slippi rules if rulesAccepted is null/0 ?

  let stepBody = null;
  if (user) {
    stepBody = (
      <>
        <Typography css={classes.sectionHeader}>{Messages.slippiOnlineRules()}</Typography>
        <div css={classes.rulesContainer}>
          <Typography>{Messages.slippiOnlineRulesDescription()}</Typography>
          <div css={classes.rulesList}>
            <Typography>1.</Typography>
            <Typography>{Messages.rule1()}</Typography>
            <Typography>2.</Typography>
            <Typography>{Messages.rule2()}</Typography>
            <Typography>3.</Typography>
            <Typography>{Messages.rule3()}</Typography>
            <Typography>4.</Typography>
            <Typography>{Messages.rule4()}</Typography>
          </div>
        </div>
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
        <Typography css={classes.sectionHeader}>{Messages.privacyPolicyAndTermsOfService()}</Typography>
        <Typography color={colors.textSecondary}>{Messages.clickTheLinksBelow()}</Typography>
        <div css={classes.policiesList}>
          <Typography color={colors.textSecondary}>●</Typography>
          <Typography color={colors.textSecondary}>
            <A css={classes.link} href="https://slippi.gg/privacy">
              {Messages.slippiPrivacyPolicy()}
            </A>
          </Typography>
          <Typography color={colors.textSecondary}>●</Typography>
          <Typography color={colors.textSecondary}>
            <A css={classes.link} href="https://slippi.gg/tos">
              {Messages.slippiTermsOfService()}
            </A>
          </Typography>
        </div>
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
            css={classes.button}
            onClick={handleAcceptClick}
            variant="contained"
            disabled={!policiesChecked || !rulesChecked || processing}
            size="large"
          >
            {processing ? <CircularProgress color="inherit" size={24} /> : Messages.acceptAll()}
          </Button>
        </div>
      </>
    );
  } else {
    stepBody = <div>{Messages.errorMissingUser()}</div>;
  }

  return <StepContainer header={Messages.acceptRulesAndPolicies()}>{stepBody}</StepContainer>;
};
