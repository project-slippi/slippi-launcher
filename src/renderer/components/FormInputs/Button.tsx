/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import MatButton, { ButtonProps } from "@material-ui/core/Button";

export const Button: React.FC<ButtonProps> = (props) => {
  const { children, ...rest } = props;
  return (
    <MatButton
      variant="contained"
      color="inherit"
      css={css`
        .MuiButton-label {
          color: #1b0b28;
          font-weight: 500;
          font-size: 12px;

          .MuiButton-startIcon {
            color: #9f74c0;
          }
        }
      `}
      {...rest}
    >
      {children}
    </MatButton>
  );
};
