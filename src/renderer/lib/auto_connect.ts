import type { ConsoleMirrorStatusUpdate } from "@console/types";
import { ConnectionStatus } from "@console/types";
import type { StoredConnection } from "@settings/types";

type GetConnectionsToAutoConnectParams = {
  // Whether the auto-connect feature is enabled. When false, nothing is auto-connected.
  enabled: boolean;
  savedConnections: StoredConnection[];
  availableIps: ReadonlySet<string>;
  connectedConsoles: Record<string, Partial<ConsoleMirrorStatusUpdate>>;
  // IPs we've already issued a connect for but haven't yet received a status update from.
  inFlightIps: ReadonlySet<string>;
  // IPs the user manually disconnected and doesn't want auto-connected again.
  optedOutIps: ReadonlySet<string>;
};

/**
 * Decides which saved connections should be auto-connected to right now.
 *
 * This is a pure function such that the decision logic can be unit tested without a
 * running component. The effect that calls it is responsible for performing the
 * actual connection.
 */
export const getConnectionsToAutoConnect = ({
  enabled,
  savedConnections,
  availableIps,
  connectedConsoles,
  inFlightIps,
  optedOutIps,
}: GetConnectionsToAutoConnectParams): StoredConnection[] => {
  if (!enabled) {
    return [];
  }
  return savedConnections.filter((conn) => {
    // Only connect to consoles that are currently broadcasting.
    if (!availableIps.has(conn.ipAddress)) {
      return false;
    }
    // Skip consoles the user has manually disconnected this session.
    if (optedOutIps.has(conn.ipAddress)) {
      return false;
    }
    // Skip consoles we've already issued a connect for but haven't heard back from yet.
    // This avoids firing a duplicate connect before the first status update arrives
    // (the mirror only emits status changes after the initial connection event).
    if (inFlightIps.has(conn.ipAddress)) {
      return false;
    }
    // Skip consoles we're already connected to (or connecting/reconnecting).
    const status = connectedConsoles[conn.ipAddress]?.status;
    if (status != null && status !== ConnectionStatus.DISCONNECTED) {
      return false;
    }
    return true;
  });
};
