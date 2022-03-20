import { colors } from "@common/colors";
import { socials } from "@common/constants";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import LiveHelpIcon from "@mui/icons-material/LiveHelp";
import CircularProgress from "@mui/material/CircularProgress";
import React from "react";
import { useToasts } from "react-toast-notifications";

import { ExternalLink as A } from "@/components/ExternalLink";
import { Button } from "@/components/FormInputs";
import { ReactComponent as DiscordIcon } from "@/styles/images/discord.svg";

const log = window.electron.log;

export const SupportBox: React.FC<{ className?: string }> = ({ className }) => {
  const [isCopying, setCopying] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const { addToast } = useToasts();

  const handleError = (err: any) => {
    log.error("Error copying logs", err);
    addToast(err.message || JSON.stringify(err), { appearance: "error" });
  };

  const onCopy = async () => {
    // Set the clipboard text
    setCopying(true);
    try {
      await window.electron.common.copyLogsToClipboard();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      handleError(err);
    } finally {
      setCopying(false);
    }
  };

  return (
    <Outer className={className}>
      <h2
        css={css`
          display: flex;
          align-items: center;
          margin: 0;
          margin-bottom: 10px;
        `}
      >
        <LiveHelpIcon style={{ marginRight: 8 }} />
        Need help?
      </h2>
      <div>
        The best way to get support is to first{" "}
        <A title={socials.discordUrl} href={socials.discordUrl}>
          join the Slippi Discord
        </A>
        , then read the information in the <b>#support-portal</b> channel before posting your issue in the appropriate
        support channel for your operating system. Our support volunteers will try their best to assist you with your
        problem.
      </div>

      <div
        css={css`
          margin-top: 5px;
          & > div {
            display: inline-block;
            margin-top: 10px;
            margin-right: 10px;
          }
        `}
      >
        <div>
          <Button
            startIcon={<DiscordIcon fill={colors.purpleLighter} style={{ height: 18, width: 18 }} />}
            onClick={() => void window.electron.shell.openPath(socials.discordUrl)}
          >
            Join the Discord
          </Button>
        </div>
        <div>
          <Button startIcon={<FileCopyIcon />} disabled={isCopying || copied} onClick={onCopy}>
            {copied ? "Copied!" : "Copy logs"}
            {isCopying && (
              <CircularProgress
                css={css`
                  margin-left: 10px;
                `}
                size={16}
                thickness={6}
                color="inherit"
              />
            )}
          </Button>
        </div>
      </div>
    </Outer>
  );
};

const Outer = styled.div`
  background-color: ${colors.purpleLight};
  color: ${colors.offWhite};
  border-radius: 10px;
  padding: 15px;

  a {
    text-decoration: underline;
  }
`;
