import type { ReplayService } from "@replays/types";

export default function createReplayClient(): ReplayService {
  return window.electron.replays;
}
