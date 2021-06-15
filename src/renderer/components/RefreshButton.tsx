/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import SyncIcon from "@material-ui/icons/Sync";

export const RefreshButton = styled(Button)`
  .MuiButton-label {
    color: #1b0b28;
    font-weight: 500;
    font-size: 12px;
  }
`;

RefreshButton.defaultProps = {
  variant: "contained",
  color: "inherit",
  startIcon: (
    <div
      css={css`
        display: flex;
        color: #9f74c0;
      `}
    >
      <SyncIcon fontSize="small" />
    </div>
  ),
};
