import { colors } from "@common/colors";
import { socials } from "@common/constants";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import LiveHelpIcon from "@mui/icons-material/LiveHelp";

import { ExternalLink as A } from "@/components/ExternalLink";
import { Button } from "@/components/FormInputs";
import { useToasts } from "@/lib/hooks/useToasts";
import { ReactComponent as DiscordIcon } from "@/styles/images/discord.svg";

const log = window.electron.log;

export const SupportBox = () => {
  const { showError, showSuccess } = useToasts();

  const onCopy = () => {
    // Set the clipboard text
    window.electron.common
      .copyLogsToClipboard()
      .then(() => {
        showSuccess("Successfully copied logs to clipboard");
      })
      .catch((err) => {
        log.error(err);
        showError(err);
      });
  };

  return (
    <Outer>
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
        <A
          title={socials.discordUrl}
          href={socials.discordUrl}
          css={css`
            text-decoration: underline;
          `}
        >
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
            LinkComponent={A}
            startIcon={<DiscordIcon fill={colors.purpleLighter} style={{ height: 18, width: 18 }} />}
            href={socials.discordUrl}
          >
            Join the Discord
          </Button>
        </div>
        <div>
          <Button startIcon={<FileCopyIcon />} onClick={onCopy}>
            Copy logs
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
`;
