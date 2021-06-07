/*
 * Typesafe IPC implementation taken from:
 * https://github.com/paneron/paneron/blob/72d1a7bd08cb89757d3bc777eee7e9bb276ea10b/src/ipc.ts
 *
 * Author: Anton Strogonoff (strogonoff)
 * License: GPL-3.0
 */

import crypto from "crypto";
import { BrowserWindow, ipcMain, IpcMainInvokeEvent, ipcRenderer, IpcRendererEvent } from "electron";
import log from "electron-log";
import { useEffect, useState } from "react";

// TODO: No need to segregate them by process type here?
const endpointsRegistered: { [key in Exclude<typeof process.type, "worker">]: string[] } = {
  browser: [],
  renderer: [],
};

const LOG_PAYLOAD_SLICE = 256;

// This will be the main export.
type EndpointMaker = {
  main: <I extends Payload, O extends Payload>(name: string, _: I, __: O) => MainEndpoint<I, O>;
  renderer: <I extends Payload>(name: string, _: I) => RendererEndpoint<I>;
};

export type SuccessPayload = { success: true };
export type EmptyPayload = Record<never, never>;

type Payload = Record<string, any>;

type BoundHandler = {
  destroy: () => void;
};

/* Main endpoint handler is expected to return a result to the renderer who triggered it */
export type MainHandler<I extends Payload, O extends Payload> = (params: I) => Promise<O>;

export type MainEndpointResponse<O extends Payload> = {
  result: O | undefined;
  errors: Error[];
  payloadHash: string;
};

/* Endpoint handled by the main thread */
type MainEndpoint<I extends Payload, O extends Payload> =
  | {
      // In main thread
      main: {
        handle: (handler: MainHandler<I, O>) => BoundHandler;
      };
      renderer?: never;
    }
  | {
      // In renderer thread
      renderer: {
        trigger: (payload: I) => Promise<MainEndpointResponse<O>>;
        useValue: (
          payload: I,
          initialValue: O,
        ) => {
          value: O;
          errors: Error[];
          findError: (ofClass: string) => Error | undefined;
          isUpdating: boolean;
          refresh: () => void;
          _reqCounter: number;
        };
      };
      main?: never;
    };

/* Renderer endpoint handler is not expected to return anything back to main thread */
export type RendererHandler<I extends Payload> = (params: I) => Promise<void>;

/* Endpoint handled by a renderer */
type RendererEndpoint<I extends Payload> =
  | {
      // In main thread
      main: {
        trigger: (payload: I) => Promise<void>;
      };
      renderer?: never;
    }
  | {
      // In renderer thread
      renderer: {
        handle: (handler: RendererHandler<I>) => BoundHandler;
        useEvent: (handler: RendererHandler<I>, memoizedArgs: any[]) => void;
      };
      main?: never;
    };

/* Placeholder for inferred generic type arguments.
   Method suggested by https://medium.com/@nandiinbao/partial-type-argument-inference-in-typescript-and-workarounds-for-it-d7c772788b2e
*/
export const _ = <unknown>null;

export const makeEndpoint: EndpointMaker = {
  /*
    Example of creating & using a main-thread endpoint:

    In shared code somewhere:

      import { _, makeEndpoint } from 'ipc'
      export const doSomething = makeEndpoint.main('do-something', <{ foo: string }>_, <{ bar: number }>_)

    In main:

      import { doSomething } from 'shared-code-somewhere'
      doSomething.main!.handle(async (evt, payload) => {
        // The type of `payload` is magically known to be `{ foo: string }`
        return { bar: 123 };
      })

    In renderer:

      import { doSomething } from 'shared-code-somewhere'
      async function handleClick() {
        const result = await doSomething.renderer!.trigger({ foo: 'hello world' })
        // The type of `result` is magically known to be `{ bar: number }`
      }
  */
  main: <I extends Payload, O extends Payload>(name: string, _: I, __: O): MainEndpoint<I, O> => {
    if (process.type === "worker") {
      throw new Error("Unsupported process type");
    } else if (endpointsRegistered[process.type].indexOf(name) >= 0) {
      log.error("Attempt to register duplicate endpoint with name", name, process.type);
      throw new Error("Attempt to register duplicate endpoint");
    } else {
      endpointsRegistered[process.type].push(name);
    }

    if (process.type === "browser") {
      return {
        main: {
          handle: (handler): BoundHandler => {
            // NOTE: only one handler on main thread side is supported per endpoint.
            // Calling someEndpoint.main.handle(...) again will silently replace existing handler, if any.

            async function _handler(_: IpcMainInvokeEvent, payload: I): Promise<MainEndpointResponse<O>> {
              // Originally we caught errors, but now we just let it throw.
              const errors: Error[] = [];

              const result: O | undefined = await handler(payload);

              const payloadSnapshot = toJSONPreservingUndefined(payload);

              return { result, errors, payloadHash: hash(payloadSnapshot) };
            }

            ipcMain.removeHandler(name);
            ipcMain.handle(name, _handler);

            return {
              destroy: () => {
                // NOTE: Electron does not allow to remove a specific handler,
                // only clearing all handlers for given endpoint
                ipcMain.removeHandler(name);
              },
            };
          },
        },
      };
    } else if (process.type === "renderer") {
      return {
        renderer: {
          trigger: async (payload: I): Promise<MainEndpointResponse<O>> => {
            const result: MainEndpointResponse<O> = await ipcRenderer.invoke(name, payload);
            return result;
          },
          useValue: (payload: I, initialValue: O) => {
            const [value, updateValue] = useState(initialValue);
            const [errors, updateErrors] = useState([] as Error[]);
            const [isUpdating, setUpdating] = useState(true);

            const [reqCounter, updateReqCounter] = useState(0);

            const payloadSnapshot = toJSONPreservingUndefined(payload);
            const payloadHash = hash(payloadSnapshot);
            const payloadSliceToLog = payloadSnapshot.slice(0, LOG_PAYLOAD_SLICE);

            useEffect(() => {
              async function doQuery() {
                setUpdating(true);

                try {
                  //log.debug("IPC: Invoking", name, payloadSliceToLog);
                  const maybeResp: any = await ipcRenderer.invoke(name, payload);

                  if (maybeResp.errors !== undefined) {
                    // NOTE: Presence of `errors` here does not mean there are errors.
                    // It is a duck-typing check that we are getting a properly formatted response structure.
                    // TODO: Hook into TypeScript with some macros to validate the value against expected type?

                    const resp = maybeResp as MainEndpointResponse<O>;

                    if (resp.payloadHash !== payloadHash) {
                      log.warn(
                        "IPC: Received payload hash differs from original",
                        name,
                        payloadSliceToLog,
                        payloadHash,
                        resp.payloadHash,
                      );
                    }

                    if (resp.result === undefined) {
                      if (resp.errors.length > 0) {
                        updateErrors(resp.errors);
                      } else {
                        log.error("IPC: Unknown error: Missing result in main IPC response", maybeResp);
                        updateErrors([new Error("IPC: Unknown error: Missing result in main IPC response")]);
                      }
                      updateValue(initialValue);
                    } else {
                      updateErrors([]);
                      updateValue(resp.result);
                      //log.debug("IPC: Got result", name, resp.result);
                    }
                  } else {
                    // TODO: updateErrors()?
                    log.error("IPC: Improperly structured main IPC response; returning whole value", maybeResp);
                    updateValue(maybeResp as O);
                  }
                } catch (e) {
                  log.error("IPC: Failed to invoke method", name, payloadSliceToLog, e);
                  updateErrors([e]);
                  updateValue(initialValue);
                } finally {
                  setUpdating(false);
                }
              }

              //log.debug("IPC: Querying", name, payloadSliceToLog);
              doQuery();
            }, [name, reqCounter, payloadHash]);

            return {
              value,
              errors,
              isUpdating,
              findError: (ofClass) => errors.find((e) => e.message.indexOf(`${ofClass}:`)),
              refresh: () =>
                updateReqCounter((counter) => {
                  return (counter += 1);
                }),
              _reqCounter: reqCounter,
            };
          },
        },
      };
    } else {
      throw new Error("Unsupported process type");
    }
  },

  renderer: <I extends Payload>(name: string, _: I): RendererEndpoint<I> => {
    if (process.type === "worker") {
      throw new Error("Unsupported process type");
    } else if (endpointsRegistered[process.type].indexOf(name) >= 0) {
      log.error("Attempt to register duplicate endpoint with name", name, process.type);
      throw new Error("Attempt to register duplicate endpoint");
    } else {
      endpointsRegistered[process.type].push(name);
    }

    if (process.type === "renderer") {
      return {
        renderer: {
          handle: (handler) => {
            async function _handler(_: IpcRendererEvent, payload: I): Promise<void> {
              await handler(payload);
            }

            ipcRenderer.on(name, _handler);

            return {
              destroy: () => {
                ipcRenderer.removeListener(name, _handler);
              },
            };
          },
          useEvent: (handler, memoizedArgs) => {
            function handleEvent(_: IpcRendererEvent, payload: I) {
              //log.silly("C/ipc/useIPCEvent: Handling IPC event", name, payload);
              handler(payload);
            }

            useEffect(() => {
              ipcRenderer.on(name, handleEvent);

              return function cleanup() {
                ipcRenderer.removeListener(name, handleEvent);
              };
            }, memoizedArgs);
          },
        },
      };
    } else if (process.type === "browser") {
      return {
        main: {
          trigger: async (payload) => {
            notifyAll(name, payload);
          },
        },
      };
    } else {
      throw new Error("Unsupported process type");
    }
  },
};

function hash(val: string): string {
  return crypto.createHash("sha1").update(val).digest("hex");
}

function toJSONPreservingUndefined(data: any) {
  return JSON.stringify(data || {}, (_, v) => (v === undefined ? "__undefined" : v)).replace(
    /"__undefined"/g,
    "undefined",
  );
}

function notifyAll(channel: string, payload: any): void {
  const allWindows = BrowserWindow.getAllWindows();
  allWindows.forEach((window) => {
    window.webContents.send(channel, payload);
  });
}
