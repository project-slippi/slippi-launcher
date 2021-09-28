/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Menu, { MenuProps } from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import React from "react";

export interface IconMenuItem {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
}

export interface IconMenuProps extends MenuProps {
  items: IconMenuItem[];
}

export const IconMenu: React.FC<IconMenuProps> = (props) => {
  const { items, ...rest } = props;
  return (
    <Menu {...rest}>
      {items.map((item) => (
        <MenuItem key={item.label} onClick={item.onClick} disabled={item.disabled}>
          <ListItemIcon
            css={css`
              margin-right: 10px;
            `}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText primary={item.label} />
        </MenuItem>
      ))}
    </Menu>
  );
};
