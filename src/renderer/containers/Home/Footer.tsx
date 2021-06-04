/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Tooltip from "@material-ui/core/Tooltip";
import TwitterIcon from "@material-ui/icons/Twitter";
import { colors } from "common/colors";
import { socials } from "common/constants";
import React from "react";

import { ExternalLink as A } from "@/components/ExternalLink";
import { ReactComponent as DiscordIcon } from "@/styles/images/discord.svg";
import { ReactComponent as PatreonIcon } from "@/styles/images/patreon.svg";

export const Footer: React.FC = () => {
  return (
    <Outer>
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
        <Social url={socials.patreonUrl} title="Support Project Slippi on Patreon">
          <div
            css={css`
              text-transform: uppercase;
              font-weight: bold;
              margin-right: 20px;
            `}
          >
            Support Slippi
          </div>
          <PatreonIcon fill={colors.purpleLight} />
        </Social>
      </div>
    </Outer>
  );
};

const Outer = styled.div`
  display: flex;
  font-size: 12px;
  justify-content: flex-end;
  padding: 0 20px;
  height: 50px;
  align-items: center;
  background-color: black;
  color: ${colors.purpleLight};

  svg {
    width: 20px;
    height: auto;
  }
`;

const Social: React.FC<{
  url: string;
  title: string;
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
        title={title}
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
