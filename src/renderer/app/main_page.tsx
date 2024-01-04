import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { Header } from "@/app/header/header";
import { LoginDialog } from "@/app/header/login_dialog";
import type { MenuItem } from "@/app/header/main_menu";
import { AuthGuard } from "@/components/AuthGuard";
import { PersistentNotification } from "@/components/PersistentNotification";

export type MainMenuItem = MenuItem & {
  Component: React.ComponentType;
  default?: boolean;
  private?: boolean;
};

export const MainPage = React.memo(({ menuItems }: { menuItems: readonly MainMenuItem[] }) => {
  const defaultRoute = menuItems.find((item) => item.default);
  return (
    <div
      style={{
        display: "flex",
        flexFlow: "column",
        height: "100%",
        width: "100%",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <Header menuItems={menuItems} />
      </div>
      <div style={{ flex: 1, overflow: "auto", display: "flex" }}>
        <Routes>
          {menuItems.map((item) => {
            const element = item.private ? (
              <AuthGuard>
                <item.Component />
              </AuthGuard>
            ) : (
              <item.Component />
            );
            return <Route key={item.subpath} path={`${item.subpath}/*`} element={element} />;
          })}
          {defaultRoute && <Route path="*" element={<Navigate replace={true} to={`${defaultRoute.subpath}`} />} />}
        </Routes>
      </div>
      <LoginDialog />
      <PersistentNotification />
    </div>
  );
});
