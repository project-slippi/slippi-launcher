import type { ButtonProps } from "@mui/material/Button";
import MatButton from "@mui/material/Button";

export const Button = ({ children, ...rest }: ButtonProps) => {
  return (
    <MatButton
      variant="contained"
      color="inherit"
      sx={{
        color: "var(--purple-darker)",
        fontWeight: 500,
        fontSize: 12,
        backgroundColor: "white",
        "& .MuiButton-startIcon": {
          color: "var(--purple-lighter)",
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
