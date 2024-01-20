import { useServices } from "@/services";

export const useToasts = () => {
  const { notificationService } = useServices();
  return notificationService;
};
