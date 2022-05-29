// Based on: https://github.com/olup/react-hook-mousetrap/blob/3138bf87a421385393c0ace20d4f3b424a5cad40/index.js

import type { ExtendedKeyboardEvent } from "mousetrap";
import mousetrap from "mousetrap";
import { useEffect, useRef } from "react";

export type MousetrapCallback = (e: ExtendedKeyboardEvent, combo: string) => void;

/**
 * Use mousetrap hook for attaching key bindings.
 *
 * @param  {(string | string[])} handlerKey - A key, key combo or array of combos according to Mousetrap documentation.
 * @param  { function } handlerCallback - A function that is triggered on key combo catch.
 * @param  { string } evtType - A string that specifies the type of event to listen for. It can be 'keypress', 'keydown' or 'keyup'.
 *                              If omitted, it will be chosen automatically based on the keys passed in.
 */
export const useMousetrap = (handlerKey: string | string[], handlerCallback: MousetrapCallback, evtType?: string) => {
  const actionRef = useRef<MousetrapCallback | null>(null);
  actionRef.current = handlerCallback;

  useEffect(() => {
    mousetrap.bind(
      handlerKey,
      (evt, combo) => {
        typeof actionRef.current === "function" && actionRef.current(evt, combo);
      },
      evtType,
    );
    return () => {
      mousetrap.unbind(handlerKey);
    };
  }, [handlerKey, handlerCallback]);
};
