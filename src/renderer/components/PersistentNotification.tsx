import { colors } from "@common/colors";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import ButtonBase from "@mui/material/ButtonBase";
import React from "react";

import { useAppStore } from "@/lib/hooks/useApp";
import { useInstallAppUpdate } from "@/lib/hooks/useInstallAppUpdate";

export const PersistentNotification: React.FC = () => {
  const updateVersion = useAppStore((store) => store.updateVersion);
  const updateReady = useAppStore((store) => store.updateReady);

  const installAppUpdate = useInstallAppUpdate();

  if (!updateVersion || !updateReady) {
    return null;
  }

  return (
    <Outer>
      <div
        css={css`
          display: flex;
          justify-content: center;
        `}
      >
        <span
          css={css`
            margin-right: 10px;
          `}
        >
          Version {updateVersion} is now available!
        </span>
        <RestartButton onClick={installAppUpdate}>Install update</RestartButton>
      </div>
    </Outer>
  );
};

const Outer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  height: 30px;
  background-color: ${colors.purpleLight};
  text-align: center;
  font-size: 14px;
`;

const RestartButton = styled(ButtonBase)`
  font-weight: 500;
  padding: 0 5px;
  &:hover {
    opacity: 0.8;
  }
`;
