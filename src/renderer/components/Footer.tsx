import { colors } from "@common/colors";
import { slippiDonateUrl, socials } from "@common/constants";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import TwitterIcon from "@mui/icons-material/Twitter";
import { Button } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import React from "react";

import { ExternalLink as A } from "@/components/ExternalLink";
import { useDolphinActions } from "@/lib/dolphin/useDolphinActions";
import { useAppUpdate } from "@/lib/hooks/useAppUpdate";
import { useServices } from "@/services";
import { ReactComponent as DiscordIcon } from "@/styles/images/discord.svg";

export const BasicFooter = styled.div`
  display: flex;
  padding: 0 20px;
  height: 50px;
  white-space: nowrap;
  align-items: center;
  background-color: black;
  font-size: 14px;
  color: ${colors.purpleLight};

  svg {
    width: 20px;
    height: auto;
  }
`;

export const Footer: React.FC = () => {
  const { dolphinService } = useServices();
  const { checkForAppUpdates } = useAppUpdate();
  const { updateDolphin } = useDolphinActions(dolphinService);
  const checkForUpdatesHandler = React.useCallback(async () => {
    void checkForAppUpdates();
    void updateDolphin();
  }, [checkForAppUpdates, updateDolphin]);

  return (
    <Outer>
      <Button
        css={css`
          text-transform: uppercase;
          font-weight: bold;
          font-size: 12px;
          margin-right: auto;
          justify-content: flex-start;
          color: ${colors.purpleLight};
        `}
        onClick={checkForUpdatesHandler}
      >
        Check for updates
      </Button>
      <Social title="Follow Project Slippi on Twitter" url={`https://twitter.com/${socials.twitterId}`}>
        <TwitterIcon />
      </Social>
      <Social title="Join the Discord" url={socials.discordUrl}>
        <DiscordIcon fill={colors.purpleLight} />
      </Social>
      <div
        css={css`
          display: flex;
          height: 30px;
          align-items: center;
          border-left: solid 1px ${colors.purpleDark};
          margin-left: 20px;
        `}
      >
        <Social url={slippiDonateUrl}>
          <div
            css={css`
              text-transform: uppercase;
              font-weight: bold;
              margin-right: 5px;
            `}
          >
            Support Slippi
          </div>
        </Social>
      </div>
    </Outer>
  );
};

const Outer = styled(BasicFooter)`
  font-size: 12px;
  justify-content: flex-end;
  svg {
    width: 20px;
    height: auto;
  }
`;

const Social: React.FC<{
  url: string;
  title?: string;
}> = ({ url, title, children }) => {
  return (
    <A
      css={css`
        display: flex;
        margin-left: 20px;
        &:hover {
          opacity: 0.7;
        }
      `}
      href={url}
    >
      <Tooltip
        title={title ?? ""}
        css={css`
          display: flex;
          align-items: center;
        `}
      >
        <div>{children}</div>
      </Tooltip>
    </A>
  );
};
