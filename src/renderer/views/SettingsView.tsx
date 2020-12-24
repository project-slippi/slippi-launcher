import React from "react";
import styled from "styled-components";
import {
  Link,
  Redirect,
  Route,
  Switch,
  useHistory,
  useRouteMatch,
} from "react-router-dom";

import { settings } from "../containers/Settings";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import Tooltip from "@material-ui/core/Tooltip";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import CloseIcon from "@material-ui/icons/Close";
import { colors } from "common/colors";
import { useSettingsModal } from "@/lib/hooks/useSettingsModal";
import { DualPane } from "@/components/DualPane";

const Outer = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
`;

const MenuColumn = styled.div``;

const ContentColumn = styled.div`
  padding-top: 30px;
  padding-bottom: 30px;
  padding-left: 30px;
  padding-right: 100px;
`;

const CloseButton = styled(IconButton)`
  position: absolute;
  top: 5px;
  right: 10px;
  z-index: 1;
`;

const settingItems = settings.flatMap((section) => section.items);

export const SettingsView: React.FC = () => {
  const history = useHistory();
  const { path } = useRouteMatch();
  const { close } = useSettingsModal();

  const isActive = (name: string): boolean => {
    return history.location.pathname === `${path}/${name}`;
  };

  const keyDownFunction = (event: any) => {
    if (event.keyCode === 27) {
      close();
    }
  };

  React.useEffect(() => {
    document.addEventListener("keydown", keyDownFunction, false);
    return () =>
      document.removeEventListener("keydown", keyDownFunction, false);
  }, [keyDownFunction]);

  return (
    <Outer>
      <Tooltip title="Close">
        <CloseButton onClick={close}>
          <CloseIcon />
        </CloseButton>
      </Tooltip>
      <DualPane
        id="settings-view"
        leftStyle={{ backgroundColor: colors.grayDark }}
        leftSide={
          <MenuColumn>
            {settings.map((section, i) => {
              return (
                <List
                  key={`section-${section.title}${i}`}
                  component="nav"
                  subheader={
                    section.title ? (
                      <ListSubheader component="div" disableSticky={true}>
                        {section.title}
                      </ListSubheader>
                    ) : undefined
                  }
                >
                  {section.items.map((item) => {
                    return (
                      <ListItem
                        button
                        key={item.name}
                        selected={isActive(item.path)}
                        component={Link}
                        to={`${path}/${item.path}`}
                      >
                        {item.icon ? (
                          <ListItemIcon>{item.icon}</ListItemIcon>
                        ) : null}
                        <ListItemText primary={item.name} />
                      </ListItem>
                    );
                  })}
                </List>
              );
            })}
          </MenuColumn>
        }
        rightSide={
          <ContentColumn>
            <Switch>
              {settingItems.map((item) => {
                const fullItemPath = `${path}/${item.path}`;
                return (
                  <Route key={fullItemPath} path={fullItemPath}>
                    {item.component}
                  </Route>
                );
              })}
              {settingItems.length > 0 && (
                <Route exact path={path}>
                  <Redirect to={`${path}/${settingItems[0].path}`} />
                </Route>
              )}
            </Switch>
          </ContentColumn>
        }
      />
    </Outer>
  );
};
