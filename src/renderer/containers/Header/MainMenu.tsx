/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import { colors } from "common/colors";
import React from "react";
import { Link, useHistory } from "react-router-dom";

export interface MenuItem {
  subpath: string;
  title: string;
  icon: React.ReactNode;
}

export interface MainMenuProps {
  path: string;
  menuItems: MenuItem[];
}

export const MainMenu: React.FC<MainMenuProps> = ({ path, menuItems }) => {
  const history = useHistory();
  const isActive = (name: string): boolean => {
    return history.location.pathname.startsWith(`${path}/${name}`);
  };

  return (
    <div
      css={css`
        display: flex;
        height: 100%;
      `}
    >
      {menuItems.map((item) => {
        return (
          <MenuButton key={item.subpath} selected={isActive(item.subpath)}>
            <Tooltip title={item.title}>
              <Button component={Link} to={`${path}/${item.subpath}`}>
                {item.icon ? item.icon : item.title}
              </Button>
            </Tooltip>
          </MenuButton>
        );
      })}
    </div>
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
    border: solid 10px transparent;
    border-bottom-color: ${(props) => (props.selected ? colors.purpleDarker : "transparent")};
  }
`;
