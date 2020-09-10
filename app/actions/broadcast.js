export const START_BROADCAST = 'START_BROADCAST';
export const STOP_BROADCAST = 'STOP_BROADCAST';

export function startBroadcast() {
  console.log("starting broadcast...");
  return {
    type: START_BROADCAST,
  };
}

export function stopBroadcast() {
  console.log("stopping broadcast...");
  return {
    type: STOP_BROADCAST,
  };
}
