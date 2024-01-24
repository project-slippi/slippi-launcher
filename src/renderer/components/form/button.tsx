import type { ButtonProps } from "@mui/material/Button";
import MatButton from "@mui/material/Button";

import { colors } from "@/styles/colors";

export const Button = ({ children, ...rest }: ButtonProps) => {
  return (
    <MatButton
      variant="contained"
      color="inherit"
      sx={{
        color: colors.purpleDarker,
        fontWeight: 500,
        fontSize: 12,
        backgroundColor: "white",
        "& .MuiButton-startIcon": {
          color: colors.purpleLighter,
        },
        "&:hover": {
          backgroundColor: "rgba(255, 255, 255, 0.7)",
        },
      }}
      {...rest}
    >
      {children}
    </MatButton>
  );
};
