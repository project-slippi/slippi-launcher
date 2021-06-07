import { _, makeEndpoint } from "../ipc";
import { MirrorDetails } from "./types";

export const addMirrorConfig = makeEndpoint.main("addMirrorConfig", <{ config: MirrorDetails }>_, <{ success: true }>_);

export const startMirroring = makeEndpoint.main("startMirroring", <{ ip: string }>_, <{ success: true }>_);
