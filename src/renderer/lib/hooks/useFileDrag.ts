import { useToasts } from "@/lib/hooks/useToasts";

export const useFileDrag = () => {
  const { showError } = useToasts();

  const fileDrag = async (event: React.DragEvent<HTMLDivElement>, filePaths: string[]) => {
    try {
      event.preventDefault();
      if (filePaths.length > 0) {
        window.electron.common.onDragState(filePaths);
      }
    } catch (err: any) {
      showError(err.message ?? JSON.stringify(err));
    }
  };

  return (event: React.DragEvent<HTMLDivElement>, filePaths: string[]) => {
    void fileDrag(event, filePaths);
  };
};
