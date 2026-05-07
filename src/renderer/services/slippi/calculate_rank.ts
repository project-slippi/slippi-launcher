import { Rank } from "./types";

const SETS_REQUIRED_FOR_RANK = 5;

// Ranked Calibration Data:
// https://docs.google.com/spreadsheets/d/1F4tPN7XxXeiHKDRpzfMIJeUkg9hwx14CM16YqYF4-FM/edit#gid=0

export const calculateRank = (rating: number, hasPlacement: boolean, setsPlayed: number): Rank => {
  if (setsPlayed === 0) {
    return Rank.NONE;
  } else if (setsPlayed < SETS_REQUIRED_FOR_RANK) {
    return Rank.PENDING;
  }

  if (rating >= 2191.75 && hasPlacement) {
    // If player is at least master 1 and has a global placement, make them a grandmaster
    return Rank.GRANDMASTER;
  } else if (rating >= 2350) {
    // I'm fibbing master 2 + 3 a bit because they're too close to one another in calibration
    return Rank.MASTER3;
  } else if (rating >= 2275) {
    return Rank.MASTER2;
  } else if (rating >= 2191.75) {
    return Rank.MASTER1;
  } else if (rating >= 2136.28) {
    return Rank.DIAMOND3;
  } else if (rating >= 2073.67) {
    return Rank.DIAMOND2;
  } else if (rating >= 2003.92) {
    return Rank.DIAMOND1;
  } else if (rating >= 1927.03) {
    return Rank.PLAT3;
  } else if (rating >= 1843.0) {
    return Rank.PLAT2;
  } else if (rating >= 1751.83) {
    return Rank.PLAT1;
  } else if (rating >= 1653.52) {
    return Rank.GOLD3;
  } else if (rating >= 1548.07) {
    return Rank.GOLD2;
  } else if (rating >= 1435.48) {
    return Rank.GOLD1;
  } else if (rating >= 1315.75) {
    return Rank.SILVER3;
  } else if (rating >= 1188.88) {
    return Rank.SILVER2;
  } else if (rating >= 1054.87) {
    return Rank.SILVER1;
  } else if (rating >= 913.72) {
    return Rank.BRONZE3;
  } else if (rating >= 765.43) {
    return Rank.BRONZE2;
  } else {
    return Rank.BRONZE1;
  }
};
