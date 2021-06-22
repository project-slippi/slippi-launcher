import { viewSlpReplay } from "@dolphin/ipc";
import { ReplayQueueItem } from "@dolphin/types";
import { useToasts } from "react-toast-notifications";

export const usePlayFiles = () => {
  const { addToast } = useToasts();

  const playFiles = async (files: ReplayQueueItem[]) => {
    try {
      const viewResult = await viewSlpReplay.renderer!.trigger({ files });
      if (!viewResult.result) {
        console.error(`Error playing file(s): ${files.join(", ")}`, viewResult.errors);
        throw new Error(`Error playing file(s): ${files.join(", ")}`);
      }
    } catch (err) {
      addToast(err.message ?? JSON.stringify(err), {
        appearance: "error",
      });
    }
  };

  return playFiles;
};
