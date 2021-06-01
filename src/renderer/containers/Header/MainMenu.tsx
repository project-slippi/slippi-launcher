/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
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
    return history.location.pathname === `${path}/${name}`;
  };

  return (
    <div
      css={css`
        display: flex;
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
  ${(props) => (props.selected ? "" : "opacity: 0.5;")}
`;
