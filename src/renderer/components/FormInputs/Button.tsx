/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import MatButton, { ButtonProps } from "@material-ui/core/Button";
import { colors } from "common/colors";

export const Button: React.FC<ButtonProps> = (props) => {
  const { children, ...rest } = props;
  return (
    <MatButton
      variant="contained"
      color="inherit"
      css={css`
        .MuiButton-label {
          color: ${colors.purpleDarker};
          font-weight: 500;
          font-size: 12px;

          .MuiButton-startIcon {
            color: ${colors.purpleLighter};
          }
        }
      `}
      {...rest}
    >
      {children}
    </MatButton>
  );
};
