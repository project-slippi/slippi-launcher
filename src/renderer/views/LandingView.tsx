import React from "react";
import { AppContext } from "@/store";
import { QuickStart } from "@/containers/QuickStart/QuickStart";

export const LandingView: React.FC = () => {
  const { state } = React.useContext(AppContext);

  return (
    <div>
      <QuickStart user={state.user} />
    </div>
  );
};
