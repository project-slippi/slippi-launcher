export interface NotificationService {
  showError: (error: Error | string | unknown) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}
