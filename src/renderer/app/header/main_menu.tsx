import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import * as stylex from "@stylexjs/stylex";
import React from "react";
import type { LinkProps } from "react-router-dom";
import { Link, useMatch, useResolvedPath } from "react-router-dom";

import { colors } from "@/styles/tokens.stylex";

export type MenuItem = {
  subpath: string;
  title: string;
  Icon: React.ComponentType;
};

type MainMenuProps = {
  menuItems: readonly MenuItem[];
};

const styles = stylex.create({
  container: {
    display: "flex",
    height: "100%",
  },
  button: {
    color: "white",
    backgroundColor: {
      ":hover": "rgba(255, 255, 255, 0.16)",
    },
  },
  base: {
    opacity: 0.5,
    position: "relative",
    display: "flex",
    height: "100%",
    "::after": {
      content: "",
      position: "absolute",
      display: "block",
      left: "50%",
      transform: "translateX(-50%)",
      bottom: 0,
      borderStyle: "solid",
      borderWidth: 0,
      borderColor: "transparent",
    },
  },
  selected: {
    opacity: 1,
    "::after": {
      borderWidth: 10,
      borderBottomColor: colors.purpleDarker,
    },
  },
});

export const MainMenu = ({ menuItems }: MainMenuProps) => {
  return (
    <div {...stylex.props(styles.container)}>
      {menuItems.map((item) => {
        return (
          <div key={item.subpath}>
            <CustomLink to={item.subpath} title={item.title}>
              {item.Icon ? <item.Icon /> : item.title}
            </CustomLink>
          </div>
        );
      })}
    </div>
  );
};

type CustomLinkProps = LinkProps & {
  title: string;
};

const CustomLink = ({ title, children, to, ...props }: CustomLinkProps) => {
  const resolved = useResolvedPath(to);
  const match = useMatch({ path: resolved.pathname, end: false });
  const isSelected = match != null;

  return (
    <div {...stylex.props(styles.base, isSelected && styles.selected)}>
      <Tooltip title={title}>
        <Button component={Link} to={to} {...(props as any)} {...stylex.props(styles.button)}>
          {children}
        </Button>
      </Tooltip>
    </div>
  );
};
