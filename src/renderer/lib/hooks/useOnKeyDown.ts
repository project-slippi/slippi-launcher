import React from "react";

export const useOnKeyDown = (keyCode: number, handler: () => void) => {
  const keyDownFunction = React.useCallback((event) => {
    if (event.keyCode === keyCode) {
      handler();
    }
  }, []);

  React.useEffect(() => {
    document.addEventListener("keydown", keyDownFunction, false);
    return () =>
      document.removeEventListener("keydown", keyDownFunction, false);
  }, []);
};
