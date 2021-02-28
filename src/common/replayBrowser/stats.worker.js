const { parentPort, workerData } = require("worker_threads");
const { SlippiGame } = require("@slippi/slippi-js");

workerData.forEach((replay) => {
  const game = new SlippiGame(replay.fullPath);
  const stats = game.getStats();
  if (stats) {
    replay.stats = stats;
  }
  parentPort.postMessage(replay);
});
