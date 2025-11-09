import { slippiDonateUrl, socials } from "@common/constants";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import TwitterIcon from "@mui/icons-material/Twitter";
import Tooltip from "@mui/material/Tooltip";
import React from "react";

import { ExternalLink as A } from "@/components/external_link";
import { colors } from "@/styles/colors";
import { ReactComponent as DiscordIcon } from "@/styles/images/discord.svg";

import { FooterMessages as Messages } from "./footer.messages";

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

export const Footer: React.ComponentType = () => {
  return (
    <Outer>
      <Social title={Messages.followOnTwitter()} url={`https://twitter.com/${socials.twitterId}`}>
        <TwitterIcon />
      </Social>
      <Social title={Messages.joinDiscord()} url={socials.discordUrl}>
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
            {Messages.supportSlippi()}
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

const Social = ({
  url,
  title,
  children,
}: React.PropsWithChildren<{
  url: string;
  title?: string;
}>) => {
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
