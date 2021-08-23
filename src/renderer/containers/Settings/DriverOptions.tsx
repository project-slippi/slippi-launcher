/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import Button from "@material-ui/core/Button";
import { isLinux, isMac } from "common/constants";
import React from "react";

import { DevGuard } from "@/components/DevGuard";

import { SettingItem } from "./SettingItem";

export const DriverOptions: React.FC = () => {
  return (
    <div>
      <DevGuard show={!isMac && !isLinux}>
        <SettingItem
          name="Install GC Adapter Drivers"
          description="Automatically install drivers for the GameCube controller adapter. This only needs to be done once."
        >
          <div
            css={css`
              display: flex;
              & > button {
                margin-right: 10px;
              }
            `}
          >
            <Button variant="contained" color="primary" /* onClick={} */ disabled={false}>
              Install drivers
            </Button>
            <Button variant="outlined" color="primary" /* onClick={} */ disabled={false}>
              Manual install
            </Button>
          </div>
        </SettingItem>
      </DevGuard>
      <DevGuard show={isMac}>
        <SettingItem
          name="Install GC Adapter Drivers"
          description="Automatic installation not available for Mac devices. Open the link below for manual instructions."
        >
          <Button variant="contained" color="primary" /* onClick={} */ disabled={false}>
            Open Instructions
          </Button>
        </SettingItem>
      </DevGuard>
      <DevGuard show={isLinux}>
        <SettingItem
          name="Install GC Adapter Drivers"
          description="Automatic installation not available for linux devices. You can execute the command below in a terminal to install drivers."
        >
          <code>
            {
              'sudo rm -f /etc/udev/rules.d/51-gcadapter.rules && sudo touch /etc/udev/rules.d/51-gcadapter.rules && echo \'SUBSYSTEM=="usb", ENV{DEVTYPE}=="usb_device", ATTRS{idVendor}=="057e", ATTRS{idProduct}=="0337", MODE="0666"\' | sudo tee /etc/udev/rules.d/51-gcadapter.rules > /dev/null && sudo udevadm control --reload-rules'
            }
          </code>
        </SettingItem>
      </DevGuard>
    </div>
  );
};
