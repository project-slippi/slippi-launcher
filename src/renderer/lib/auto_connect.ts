import type { ConsoleMirrorStatusUpdate } from "@console/types";
import { ConnectionStatus } from "@console/types";
import type { StoredConnection } from "@settings/types";

type GetConnectionsToAutoConnectParams = {
  savedConnections: StoredConnection[];
  availableIps: ReadonlySet<string>;
  connectedConsoles: Record<string, Partial<ConsoleMirrorStatusUpdate>>;
  // IPs we've already issued a connect for but haven't yet received a status update from.
  inFlightIps: ReadonlySet<string>;
};

/**
 * Decides which saved connections should be auto-connected to right now.
 *
 * This is a pure function such that the decision logic can be unit tested without a
 * running component. The effect that calls it is responsible for performing the
 * actual connection.
 */
export const getConnectionsToAutoConnect = ({
  savedConnections,
  availableIps,
  connectedConsoles,
  inFlightIps,
}: GetConnectionsToAutoConnectParams): StoredConnection[] => {
  return savedConnections.filter((conn) => {
    // Only connect to consoles that are currently broadcasting.
    if (!availableIps.has(conn.ipAddress)) {
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
