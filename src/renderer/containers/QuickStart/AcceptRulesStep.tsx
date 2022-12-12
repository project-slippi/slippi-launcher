import { colors } from "@common/colors";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { Button, Checkbox, CircularProgress, FormControlLabel, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import React, { useState } from "react";

import { ExternalLink as A } from "@/components/ExternalLink";
import { useAccount, useUserData } from "@/lib/hooks/useAccount";
import { useToasts } from "@/lib/hooks/useToasts";
import { useServices } from "@/services";

import { QuickStartHeader } from "./QuickStartHeader";

const Container = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 800px;
`;

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

export const AcceptRulesStep: React.FC = () => {
  const { slippiBackendService } = useServices();
  const { showError } = useToasts();
  const refreshUserData = useUserData();
  const user = useAccount((store) => store.user);
  const [rulesChecked, setRulesChecked] = useState(false);
  const [policiesChecked, setPoliciesChecked] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleAcceptClick = async () => {
    setProcessing(true);

    try {
      await slippiBackendService.acceptRules();
      await refreshUserData();
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
        <Typography css={classes.sectionHeader}>Slippi Online Rules</Typography>
        <div css={classes.rulesContainer}>
          <Typography>
            These are a set of rules to follow when using Slippi. Breaking these rules may result in a suspension or ban
            depending on severity and frequency. This is not an exhaustive list, we reserve the right to suspend or ban
            an account for any reason.
          </Typography>
          <div css={classes.rulesList}>
            <Typography>1.</Typography>
            <Typography>
              Racist, homophobic, transphobic, or otherwise bigoted names and codes are not allowed. Targeted harassment
              in names and codes is also not allowed.
            </Typography>
            <Typography>2.</Typography>
            <Typography>
              Slippi does its best to promote fairness in terms of player matching, result reporting, etc. Attempting to
              circumvent these systems is not allowed.
            </Typography>
            <Typography>3.</Typography>
            <Typography>Intentionally manipulating the game performance for your own gain is not allowed.</Typography>
            <Typography>4.</Typography>
            <Typography>Macros and bots are not allowed.</Typography>
          </div>
        </div>
        <FormControlLabel
          label="Accept Slippi Rules"
          control={
            <Checkbox
              checked={rulesChecked}
              disabled={processing}
              onChange={(_event, value) => setRulesChecked(value)}
              sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
            />
          }
        />
        <Typography css={classes.sectionHeader}>Privacy Policy and Terms of Service</Typography>
        <div css={classes.policiesList}>
          <Typography color={colors.textSecondary}>●</Typography>
          <Typography color={colors.textSecondary}>
            Click to review the{" "}
            <A css={classes.link} href="https://slippi.gg/privacy">
              Slippi Privacy Policy
            </A>
          </Typography>
          <Typography color={colors.textSecondary}>●</Typography>
          <Typography color={colors.textSecondary}>
            Click to review the{" "}
            <A css={classes.link} href="https://slippi.gg/tos">
              Slippi Terms of Service
            </A>
          </Typography>
        </div>
        <FormControlLabel
          label="Accept Privacy Policy and Terms of Service"
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
            {processing ? <CircularProgress color="inherit" size={24} /> : "Accept All"}
          </Button>
        </div>
      </>
    );
  } else {
    stepBody = <div>An error occurred. The application does not have a user.</div>;
  }

  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <Container>
        <QuickStartHeader>Accept rules and policies</QuickStartHeader>
        {stepBody}
      </Container>
    </Box>
  );
};
