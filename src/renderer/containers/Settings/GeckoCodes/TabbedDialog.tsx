import { css } from "@emotion/react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import React from "react";

export const TabbedDialog = React.memo(function TabbedDialog({
  currentTab,
  setCurrentTab,
  tabs,
  open,
  onClose,
}: {
  open: boolean;
  currentTab: number;
  tabs: { name: string; Component: React.ComponentType }[];
  setCurrentTab: (tabIndex: number) => void;
  onClose: () => void;
}) {
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    event.preventDefault();
    setCurrentTab(newValue);
  };

  return (
    <Dialog open={open} fullWidth={true} onClose={onClose}>
      <DialogTitle sx={{ padding: 0 }}>
        <Tabs value={currentTab} variant="fullWidth" onChange={handleTabChange}>
          {tabs.map(({ name }, i) => (
            <Tab key={i} label={name} />
          ))}
        </Tabs>
      </DialogTitle>
      <DialogContent>
        {tabs.map(({ Component }, i) => (
          <TabPanel value={currentTab} index={i} key={i}>
            <Component />
          </TabPanel>
        ))}
      </DialogContent>
    </Dialog>
  );
});

const TabPanel = ({ value, index, children }: React.PropsWithChildren<{ index: number; value: number }>) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      css={css`
        height: 70vh;
      `}
    >
      {value === index && <Box sx={{ height: "100%" }}>{children}</Box>}
    </div>
  );
};
