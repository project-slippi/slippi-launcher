import { useCallback } from "react";

import { useToasts } from "@/lib/hooks/useToasts";

export const useFileDrag = () => {
  const { showError } = useToasts();

  const handleDrag = useCallback(
    (event: React.DragEvent<HTMLDivElement>, filePaths: string[]) => {
      event.preventDefault();
      try {
        if (filePaths.length > 0) {
          window.electron.common.onDragStart(filePaths);
        }
      } catch (err) {
        showError(err);
      }
    },
    [showError],
  );

  return handleDrag;
};
