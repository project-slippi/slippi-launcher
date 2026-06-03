import type { ConsoleMirrorStatusUpdate } from "@console/types";
import { ConnectionStatus } from "@console/types";
import type { StoredConnection } from "@settings/types";

type GetConnectionsToAutoConnectParams = {
  savedConnections: StoredConnection[];
  availableIps: ReadonlySet<string>;
  connectedConsoles: Record<string, Partial<ConsoleMirrorStatusUpdate>>;
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
}: GetConnectionsToAutoConnectParams): StoredConnection[] => {
  return savedConnections.filter((conn) => {
    // Only connect to consoles that are currently broadcasting.
    if (!availableIps.has(conn.ipAddress)) {
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
