import { useCallback } from "react";

import { useToasts } from "@/lib/hooks/useToasts";

export const useFileDrag = () => {
  const { showError } = useToasts();

  const fileDrag = useCallback(
    async (event: React.DragEvent<HTMLDivElement>, filePaths: string[]) => {
      try {
        event.preventDefault();
        if (filePaths.length > 0) {
          window.electron.common.onDragStart(filePaths);
        }
      } catch (err) {
        showError(err);
      }
    },
    [showError],
  );

  const handleDrag = useCallback(
    (event: React.DragEvent<HTMLDivElement>, filePaths: string[]) => {
      void fileDrag(event, filePaths);
    },
    [fileDrag],
  );

  return handleDrag;
};
