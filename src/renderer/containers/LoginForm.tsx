import firebase from "firebase";
import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import { useAsync } from "@/lib/hooks/useAsync";

const useStyles = makeStyles(() => ({
  cssLabel: {
    color: "#dddddd",
    "&.Mui-focused": {
      color: "#ffffff",
    },
  },
}));

export const LoginForm: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const classes = useStyles();

  const { execute, loading, error } = useAsync(async () => {
    await firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then((user) => {
        // Putting the clean up step here curiously seems to fix the state setting on unmounted component
        if (user) {
          // Clear inputs on successful login
          setEmail("");
          setPassword("");
        }
      });
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        execute();
      }}
    >
      <Grid container spacing={8} alignItems="flex-end">
        <Grid item md={true} sm={true} xs={true}>
          <TextField
            disabled={loading}
            label="Email"
            variant="filled"
            value={email}
            fullWidth
            required
            onChange={(e) => setEmail(e.target.value)}
            InputLabelProps={{
              classes: {
                root: classes.cssLabel,
              },
            }}
          />
        </Grid>
      </Grid>
      <Grid container spacing={8} alignItems="flex-end">
        <Grid item md={true} sm={true} xs={true}>
          <TextField
            disabled={loading}
            variant="filled"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPassword ? "text" : "password"}
            fullWidth
            required
            InputLabelProps={{
              classes: {
                root: classes.cssLabel,
              },
            }}
            InputProps={{
              endAdornment: (
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  onMouseDown={(e) => e.preventDefault()}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />
        </Grid>
      </Grid>
      {error && (
        <Grid>
          <p>{error.message}</p>
        </Grid>
      )}
      <Grid container justify="flex-end" style={{ marginTop: "15px" }}>
        <Button
          type="submit"
          color="primary"
          disabled={loading}
          variant="contained"
          style={{ textTransform: "none" }}
        >
          Log in
        </Button>
      </Grid>
    </form>
  );
};
