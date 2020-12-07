import firebase from "firebase";
import React from "react";

import { useAsync } from "@/lib/hooks/useAsync";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const { execute, loading, error } = useAsync(async () => {
    const user = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    if (user) {
      // Clear inputs on successful login
      setEmail("");
      setPassword("");
    }
  });

  return (
    <div>
      <h3>Login with Slippi.gg</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          execute();
        }}
      >
        <div>
          <input
            placeholder="Email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button disabled={loading} type="submit">
          Submit
        </button>
      </form>
      {error && <div>{error.message}</div>}
    </div>
  );
};
