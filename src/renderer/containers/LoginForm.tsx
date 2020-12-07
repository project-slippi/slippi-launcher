import firebase from "firebase";
import React from "react";

import { useSubmit } from "@/lib/hooks/useSubmit";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [handleSubmit, loading, error] = useSubmit(async () => {
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
          handleSubmit();
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
