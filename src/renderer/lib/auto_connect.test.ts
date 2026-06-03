import type { ConsoleMirrorStatusUpdate } from "@console/types";
import { ConnectionStatus } from "@console/types";
import type { StoredConnection } from "@settings/types";
import { describe, expect, it } from "vitest";

import { getConnectionsToAutoConnect } from "./auto_connect";

const makeConnection = (id: number, ipAddress: string): StoredConnection => ({
  id,
  ipAddress,
  folderPath: "/tmp/slp",
  isRealtime: false,
  enableAutoSwitcher: false,
  enableRelay: false,
  useNicknameFolders: false,
});

describe("getConnectionsToAutoConnect", () => {
  it("connects to a saved console that is available and disconnected", () => {
    const conn = makeConnection(1, "192.168.0.5");
    const result = getConnectionsToAutoConnect({
      savedConnections: [conn],
      availableIps: new Set(["192.168.0.5"]),
      connectedConsoles: {},
    });
    expect(result).toEqual([conn]);
  });

  it("skips a saved console that is not currently broadcasting on the network", () => {
    const result = getConnectionsToAutoConnect({
      savedConnections: [makeConnection(1, "192.168.0.5")],
      availableIps: new Set(),
      connectedConsoles: {},
    });
    expect(result).toEqual([]);
  });

  it("skips a console that is already connecting", () => {
    const result = getConnectionsToAutoConnect({
      savedConnections: [makeConnection(1, "192.168.0.5")],
      availableIps: new Set(["192.168.0.5"]),
      connectedConsoles: { "192.168.0.5": { status: ConnectionStatus.CONNECTING } },
    });
    expect(result).toEqual([]);
  });

  it("skips a console that is already connected", () => {
    const result = getConnectionsToAutoConnect({
      savedConnections: [makeConnection(1, "192.168.0.5")],
      availableIps: new Set(["192.168.0.5"]),
      connectedConsoles: { "192.168.0.5": { status: ConnectionStatus.CONNECTED } },
    });
    expect(result).toEqual([]);
  });

  it("skips a console that is waiting to reconnect", () => {
    const result = getConnectionsToAutoConnect({
      savedConnections: [makeConnection(1, "192.168.0.5")],
      availableIps: new Set(["192.168.0.5"]),
      connectedConsoles: { "192.168.0.5": { status: ConnectionStatus.RECONNECT_WAIT } },
    });
    expect(result).toEqual([]);
  });

  it("connects to a console whose previous status is disconnected", () => {
    const conn = makeConnection(1, "192.168.0.5");
    const result = getConnectionsToAutoConnect({
      savedConnections: [conn],
      availableIps: new Set(["192.168.0.5"]),
      connectedConsoles: { "192.168.0.5": { status: ConnectionStatus.DISCONNECTED } },
    });
    expect(result).toEqual([conn]);
  });

  it("returns only the subset of saved connections that are available and disconnected", () => {
    const available = makeConnection(1, "192.168.0.5");
    const offline = makeConnection(2, "192.168.0.6");
    const alreadyConnected = makeConnection(3, "192.168.0.7");
    const result = getConnectionsToAutoConnect({
      savedConnections: [available, offline, alreadyConnected],
      availableIps: new Set(["192.168.0.5", "192.168.0.7"]),
      connectedConsoles: {
        "192.168.0.7": { status: ConnectionStatus.CONNECTED } as Partial<ConsoleMirrorStatusUpdate>,
      },
    });
    expect(result).toEqual([available]);
  });

  it("returns an empty array when there are no saved connections", () => {
    const result = getConnectionsToAutoConnect({
      savedConnections: [],
      availableIps: new Set(["192.168.0.5"]),
      connectedConsoles: {},
    });
    expect(result).toEqual([]);
  });
});
