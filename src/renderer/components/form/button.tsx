import type { ButtonProps } from "@mui/material/Button";
import MatButton from "@mui/material/Button";

import { cssVar } from "@/styles/css_variables";

export const Button = ({ children, ...rest }: ButtonProps) => {
  return (
    <MatButton
      variant="contained"
      color="inherit"
      sx={{
        color: cssVar("purpleDarker"),
        fontWeight: 500,
        fontSize: 12,
        backgroundColor: "white",
        "& .MuiButton-startIcon": {
          color: cssVar("purpleLighter"),
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
