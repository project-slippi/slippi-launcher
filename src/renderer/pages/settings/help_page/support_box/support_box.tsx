import { socials } from "@common/constants";
import { css } from "@emotion/react";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import LiveHelpIcon from "@mui/icons-material/LiveHelp";
import * as stylex from "@stylexjs/stylex";
import log from "electron-log";

import { ExternalLink as A } from "@/components/external_link";
import { Button } from "@/components/form/button";
import { useToasts } from "@/lib/hooks/use_toasts";
import { ReactComponent as DiscordIcon } from "@/styles/images/discord.svg";
import { colors } from "@/styles/tokens.stylex";

import { NetworkDiagnosticsButton } from "./network_diagnostics/network_diagnostics_button/network_diagnostics_button";
import { SupportBoxMessages as Messages } from "./support_box.messages";

const styles = stylex.create({
  container: {
    backgroundColor: colors.purpleLight,
    color: colors.offWhite,
    borderRadius: "10px",
    padding: "15px",
  },
  iconContainer: {
    display: "flex",
    alignItems: "center",
    margin: 0,
    marginBottom: "10px",
  },
  helpIcon: {
    marginRight: 8,
  },
  link: {
    textDecoration: "underline",
  },
});

export const SupportBox = () => {
  const { showError, showSuccess } = useToasts();

  const onCopy = () => {
    // Set the clipboard text
    window.electron.common
      .copyLogsToClipboard()
      .then(() => {
        showSuccess(Messages.successfullyCopied());
      })
      .catch((err) => {
        log.error(err);
        showError(err);
      });
  };

  return (
    <div {...stylex.props(styles.container)}>
      <h2 {...stylex.props(styles.iconContainer)}>
        <LiveHelpIcon {...stylex.props(styles.helpIcon)} />
        {Messages.needHelp()}
      </h2>
      <div>{Messages.bestWayToGetSupport()}</div>
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
            {Messages.joinDiscord()}
          </Button>
        </div>
        <div>
          <Button startIcon={<FileCopyIcon />} onClick={onCopy}>
            {Messages.copyLogs()}
          </Button>
        </div>
        <div>
          <NetworkDiagnosticsButton />
        </div>
      </div>
    </div>
  );
};
