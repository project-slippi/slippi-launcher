import { colors } from "@common/colors";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Tooltip from "@mui/material/Tooltip";
import React from "react";
import type { LinkProps } from "react-router-dom";
import { Link, Navigate, Route, Routes, useMatch, useResolvedPath } from "react-router-dom";

import { DualPane } from "@/components/DualPane";
import { BuildInfo } from "@/containers/Settings/BuildInfo";
import { useMousetrap } from "@/lib/hooks/useMousetrap";
import { useSettingsModal } from "@/lib/hooks/useSettingsModal";
import { platformTitleBarStyles } from "@/styles/platformTitleBarStyles";
import { withSlippiBackground } from "@/styles/withSlippiBackground";

import { settings } from "../containers/Settings";

const Outer = styled.div`
  position: relative;
  display: flex;
  height: 100%;
  width: 100%;
  ${withSlippiBackground}
`;

const MenuColumn = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding-top: 30px;
  ${() => platformTitleBarStyles(50)}
`;

const ContentColumn = styled.div`
  flex: 1;
  overflow-x: hidden;
  ${() => platformTitleBarStyles()}
  padding: 30px;
  padding-right: 100px;
`;

const CloseButton = styled(IconButton)`
  opacity: 0.5;
  position: absolute;
  top: 20px;
  right: 10px;
  z-index: 1;
`;

const settingItems = settings.flatMap((section) => section.items);

export const SettingsView: React.FC = () => {
  const { close } = useSettingsModal();
  useMousetrap("escape", close);

  return (
    <Outer>
      <Tooltip title="Close">
        <CloseButton onClick={close}>
          <CloseIcon />
        </CloseButton>
      </Tooltip>
      <DualPane
        id="settings-view"
        leftStyle={{ backgroundColor: colors.purpleDark }}
        leftSide={
          <MenuColumn>
            <div
              css={css`
                flex: 1;
              `}
            >
              {settings.map((section, i) => {
                return (
                  <List
                    key={`section-${section.title}${i}`}
                    component="nav"
                    css={css`
                      margin: 0 10px;
                      padding-bottom: 10px;
                      border-bottom: solid 1px rgba(255, 255, 255, 0.1);
                    `}
                    subheader={
                      section.title ? (
                        <ListSubheader
                          component="div"
                          disableSticky={true}
                          css={css`
                            line-height: 20px;
                            margin-top: 10px;
                            margin-bottom: 5px;
                            font-size: 14px;
                            color: ${colors.purpleLight};
                          `}
                        >
                          {section.title}
                        </ListSubheader>
                      ) : undefined
                    }
                  >
                    {section.items.map((item) => {
                      return (
                        <div key={item.name}>
                          <CustomLink to={item.path}>
                            {item.icon ? <ListItemIcon>{item.icon}</ListItemIcon> : null}
                            <ListItemText
                              primary={item.name}
                              css={css`
                                .MuiTypography-body1 {
                                  font-size: 16px;
                                }
                              `}
                            />
                          </CustomLink>
                        </div>
                      );
                    })}
                  </List>
                );
              })}
            </div>
            <BuildInfo enableAdvancedUserClick={true} />
          </MenuColumn>
        }
        rightSide={
          <ContentColumn>
            <Routes>
              {settingItems.map((item) => {
                return <Route key={item.path} path={item.path} element={item.component} />;
              })}
              {settingItems.length > 0 && <Route path="*" element={<Navigate to={settingItems[0].path} />} />}
            </Routes>
          </ContentColumn>
        }
      />
    </Outer>
  );
};

const CustomLink = ({ children, to, ...props }: LinkProps) => {
  const resolved = useResolvedPath(to);
  const match = useMatch({ path: resolved.pathname, end: true });

  return (
    <ListItem
      button
      selected={match !== null}
      component={Link}
      to={to}
      {...(props as any)}
      css={css`
        border-radius: 10px;
        padding-top: 4px;
        padding-bottom: 4px;
        margin: 2px 0;
      `}
    >
      {children}
    </ListItem>
  );
};
