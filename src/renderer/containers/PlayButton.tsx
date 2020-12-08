import { useAsync } from "@/lib/hooks/useAsync";
import { startGame } from "@/lib/startGame";
import { Action, AppContext } from "@/store";
import React from "react";
import { ISOFileSelector } from "./ISOFileSelector";

export const PlayButton: React.FC = () => {
  const { state, dispatch } = React.useContext(AppContext);
  const handleAsync = useAsync(async () => {
    console.log("play clicked");
    dispatch({
      type: Action.SET_INSTALL_STATUS,
      payload: "",
    });
    await startGame((status) => {
      console.log(status);
      dispatch({
        type: Action.SET_INSTALL_STATUS,
        payload: status,
      });
    }).finally(() => {
      dispatch({
        type: Action.SET_INSTALL_STATUS,
        payload: "",
      });
    });
  });
  return (
    <div>
      <ISOFileSelector />
      <button disabled={handleAsync.loading} onClick={handleAsync.execute}>
        Play
      </button>
      <div>{state.installStatus}</div>
      {handleAsync.error && <div>{handleAsync.error.message}</div>}
    </div>
  );
};
