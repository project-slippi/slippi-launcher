/** @jsx jsx */
import { colors } from "@common/colors";
import { css, jsx } from "@emotion/react";
import type { ButtonProps } from "@material-ui/core/Button";
import MatButton from "@material-ui/core/Button";

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
