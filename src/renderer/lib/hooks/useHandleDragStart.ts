import { ipcRenderer } from "electron";
import { useToasts } from "react-toast-notifications";

export const useHandleDragStart = () => {
  const { addToast } = useToasts();

  const handleDragStart = async (e: React.DragEvent<HTMLDivElement>, filePaths: string[]) => {
    try {
      e.preventDefault();
      if (filePaths.length > 0) {
        ipcRenderer.send("onDragStart", filePaths);
      }
    } catch (err) {
      addToast(err.message ?? JSON.stringify(err), {
        appearance: "error",
      });
    }
  };

  return (e: React.DragEvent<HTMLDivElement>, filePaths: string[]) => {
    void handleDragStart(e, filePaths);
  };
};
