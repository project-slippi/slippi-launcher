/** @jsx jsx */
import { colors } from "@common/colors";
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import React from "react";
import type { LinkProps } from "react-router-dom";
import { Link, useMatch, useResolvedPath } from "react-router-dom";

export interface MenuItem {
  subpath: string;
  title: string;
  icon: React.ReactNode;
}

export interface MainMenuProps {
  path: string;
  menuItems: MenuItem[];
}

export const MainMenu: React.FC<MainMenuProps> = ({ menuItems }) => {
  return (
    <div
      css={css`
        display: flex;
        height: 100%;
      `}
    >
      {menuItems.map((item) => {
        return (
          <div key={item.subpath}>
            <CustomLink to={item.subpath} title={item.title}>
              {item.icon ? item.icon : item.title}
            </CustomLink>
          </div>
        );
      })}
    </div>
  );
};

interface CustomLinkProps extends LinkProps {
  title: string;
}

const CustomLink = ({ title, children, to, ...props }: CustomLinkProps) => {
  const resolved = useResolvedPath(to);
  const match = useMatch({ path: resolved.pathname, end: false });

  return (
    <MenuButton selected={match !== null}>
      <Tooltip title={title}>
        <Button component={Link} to={to} {...(props as any)}>
          {children}
        </Button>
      </Tooltip>
    </MenuButton>
  );
};

const MenuButton = styled.div<{
  selected?: boolean;
}>`
  position: relative;
  ${(props) => (props.selected ? "" : "opacity: 0.5;")}
  display: flex;
  height: 100%;
  &::after {
    content: "";
    position: absolute;
    display: block;
    left: 50%;
    transform: translateX(-50%);
    bottom: 0;
    border-style: solid;
    border-width: ${(props) => (props.selected ? "10px" : "0")};
    border-color: transparent;
    border-bottom-color: ${(props) => (props.selected ? colors.purpleDarker : "transparent")};
  }
`;
