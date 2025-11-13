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

import { BuildInfo } from "@/components/build_info/build_info";
import { DualPane } from "@/components/dual_pane";
import { useMousetrap } from "@/lib/hooks/use_mousetrap";
import { useSettingsModal } from "@/lib/hooks/use_settings_modal";
import type { SettingSection } from "@/pages/settings/types";
import { colors } from "@/styles/colors";
import { platformTitleBarStyles } from "@/styles/platform_title_bar_styles";
import { withSlippiBackground } from "@/styles/with_slippi_background";

import { SettingsPageMessages as Messages } from "./settings_page.messages";

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
  width: 100%;
  display: flex;
  padding-top: 30px;
  max-width: 800px;
  ${() => platformTitleBarStyles(50)}
`;

const CloseButton = styled(IconButton)`
  opacity: 0.5;
  position: absolute;
  top: 20px;
  right: 10px;
  z-index: 1;
`;

export const SettingsPage = React.memo(({ settings }: { settings: SettingSection[] }) => {
  const settingItems = settings.flatMap((section) => section.items);
  const { close } = useSettingsModal();
  useMousetrap("escape", close);

  return (
    <Outer>
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
                    key={`section-${section.title?.()}${i}`}
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
                          {section.title?.()}
                        </ListSubheader>
                      ) : undefined
                    }
                  >
                    {section.items.map((item) => {
                      return (
                        <div key={item.name()}>
                          <CustomLink to={item.path}>
                            {item.icon ? <ListItemIcon>{item.icon}</ListItemIcon> : null}
                            <ListItemText
                              primary={item.name()}
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
            <div style={{ paddingLeft: 30, paddingBottom: 30, paddingRight: 100, flex: 1 }}>
              <Routes>
                {settingItems.map((item) => {
                  return <Route key={item.path} path={item.path} element={item.component} />;
                })}
                {settingItems.length > 0 && <Route path="*" element={<Navigate to={settingItems[0].path} />} />}
              </Routes>
            </div>
          </ContentColumn>
        }
      />
      <Tooltip title={Messages.close()}>
        <CloseButton onClick={close}>
          <CloseIcon />
        </CloseButton>
      </Tooltip>
    </Outer>
  );
});

const CustomLink = ({ children, to, ...props }: LinkProps) => {
  const resolved = useResolvedPath(to);
  const match = useMatch({ path: resolved.pathname, end: true });

  return (
    <ListItem
      button={true}
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
