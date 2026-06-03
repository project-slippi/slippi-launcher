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

type Params = Parameters<typeof getConnectionsToAutoConnect>[0];

// Runs the decision with sensible defaults so each test only specifies what it cares about.
const run = (overrides: Partial<Params>): StoredConnection[] =>
  getConnectionsToAutoConnect({
    enabled: true,
    savedConnections: [],
    availableIps: new Set<string>(),
    connectedConsoles: {} as Record<string, Partial<ConsoleMirrorStatusUpdate>>,
    inFlightIps: new Set<string>(),
    optedOutIps: new Set<string>(),
    ...overrides,
  });

describe("getConnectionsToAutoConnect", () => {
  it("connects to a saved console that is available and disconnected", () => {
    const conn = makeConnection(1, "192.168.0.5");
    const result = run({ savedConnections: [conn], availableIps: new Set(["192.168.0.5"]) });
    expect(result).toEqual([conn]);
  });

  it("returns an empty array when auto-connect is disabled, even if a console is available", () => {
    const result = run({
      enabled: false,
      savedConnections: [makeConnection(1, "192.168.0.5")],
      availableIps: new Set(["192.168.0.5"]),
    });
    expect(result).toEqual([]);
  });

  it("skips a console the user has opted out of (manually disconnected)", () => {
    const result = run({
      savedConnections: [makeConnection(1, "192.168.0.5")],
      availableIps: new Set(["192.168.0.5"]),
      optedOutIps: new Set(["192.168.0.5"]),
    });
    expect(result).toEqual([]);
  });

  it("skips a saved console that is not currently broadcasting on the network", () => {
    const result = run({ savedConnections: [makeConnection(1, "192.168.0.5")], availableIps: new Set() });
    expect(result).toEqual([]);
  });

  it("skips a console that is already connecting", () => {
    const result = run({
      savedConnections: [makeConnection(1, "192.168.0.5")],
      availableIps: new Set(["192.168.0.5"]),
      connectedConsoles: { "192.168.0.5": { status: ConnectionStatus.CONNECTING } },
    });
    expect(result).toEqual([]);
  });

  it("skips a console that is already connected", () => {
    const result = run({
      savedConnections: [makeConnection(1, "192.168.0.5")],
      availableIps: new Set(["192.168.0.5"]),
      connectedConsoles: { "192.168.0.5": { status: ConnectionStatus.CONNECTED } },
    });
    expect(result).toEqual([]);
  });

  it("skips a console that is waiting to reconnect", () => {
    const result = run({
      savedConnections: [makeConnection(1, "192.168.0.5")],
      availableIps: new Set(["192.168.0.5"]),
      connectedConsoles: { "192.168.0.5": { status: ConnectionStatus.RECONNECT_WAIT } },
    });
    expect(result).toEqual([]);
  });

  it("connects to a console whose previous status is disconnected", () => {
    const conn = makeConnection(1, "192.168.0.5");
    const result = run({
      savedConnections: [conn],
      availableIps: new Set(["192.168.0.5"]),
      connectedConsoles: { "192.168.0.5": { status: ConnectionStatus.DISCONNECTED } },
    });
    expect(result).toEqual([conn]);
  });

  // The race: connect was already issued but no status update has arrived yet, so
  // connectedConsoles is still empty for this IP. Without the in-flight guard a second
  // discovery update would fire a duplicate connect.
  it("skips a console with an in-flight connection attempt even when no status has arrived", () => {
    const result = run({
      savedConnections: [makeConnection(1, "192.168.0.5")],
      availableIps: new Set(["192.168.0.5"]),
      connectedConsoles: {},
      inFlightIps: new Set(["192.168.0.5"]),
    });
    expect(result).toEqual([]);
  });

  it("connects to an available console that is not in the in-flight set", () => {
    const conn = makeConnection(1, "192.168.0.5");
    const result = run({
      savedConnections: [conn],
      availableIps: new Set(["192.168.0.5"]),
      inFlightIps: new Set(["192.168.0.99"]),
    });
    expect(result).toEqual([conn]);
  });

  it("returns only the subset of saved connections that are available and disconnected", () => {
    const available = makeConnection(1, "192.168.0.5");
    const offline = makeConnection(2, "192.168.0.6");
    const alreadyConnected = makeConnection(3, "192.168.0.7");
    const result = run({
      savedConnections: [available, offline, alreadyConnected],
      availableIps: new Set(["192.168.0.5", "192.168.0.7"]),
      connectedConsoles: { "192.168.0.7": { status: ConnectionStatus.CONNECTED } },
    });
    expect(result).toEqual([available]);
  });

  it("returns an empty array when there are no saved connections", () => {
    const result = run({ availableIps: new Set(["192.168.0.5"]) });
    expect(result).toEqual([]);
  });
});
