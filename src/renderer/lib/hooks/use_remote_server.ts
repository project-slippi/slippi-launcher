import { useServices } from "@/services";

export const useRemoteServer = () => {
  const { authService, remoteService } = useServices();
  const startRemoteServer = async () => {
    const authToken = await authService.getUserToken();
    return remoteService.startRemoteServer(authToken);
  };
  const reconnectRemoteServer = async () => {
    const authToken = await authService.getUserToken();
    return remoteService.reconnectRemoteServer(authToken);
  };
  const stopRemoteServer = async () => {
    return remoteService.stopRemoteServer();
  };
  return [startRemoteServer, reconnectRemoteServer, stopRemoteServer] as const;
};
