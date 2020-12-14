import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
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
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import CloseIcon from "@material-ui/icons/Close";
import { colors } from "common/colors";

const Outer = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 250px auto;
  height: 100vh;
`;

const MenuColumn = styled(OverlayScrollbarsComponent)`
  background-color: ${colors.grayDark};
`;

const ContentColumn = styled.div`
  padding-top: 50px;
  padding-bottom: 30px;
  padding-left: 30px;
  padding-right: 100px;
`;

const CloseButton = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1;
`;

const settingItems = settings.flatMap((section) => section.items);

export const SettingsView: React.FC = () => {
  const history = useHistory();
  const { path } = useRouteMatch();

  const isActive = (name: string): boolean => {
    return history.location.pathname === `${path}/${name}`;
  };

  const onClose = () => {
    history.push("/home");
  };

  return (
    <Outer>
      <CloseButton>
        <IconButton aria-label="close" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </CloseButton>
      <MenuColumn options={{ sizeAutoCapable: false }}>
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
      <OverlayScrollbarsComponent options={{ sizeAutoCapable: false }}>
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
      </OverlayScrollbarsComponent>
    </Outer>
  );
};
