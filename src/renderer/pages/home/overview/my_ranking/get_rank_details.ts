import keyBy from "lodash/keyBy";

const ranks = [
  {
    key: "none",
    name: "None",
  },
  {
    key: "banned",
    name: "Banned",
  },
  {
    key: "pending",
    name: "Pending",
  },
  {
    key: "bronze1",
    name: "Bronze 1",
    color: "#E06A36",
  },
  {
    key: "bronze2",
    name: "Bronze 2",
    color: "#E06A36",
  },
  {
    key: "bronze3",
    name: "Bronze 3",
    color: "#E06A36",
  },
  {
    key: "silver1",
    name: "Silver 1",
    color: "#B5A5B7",
  },
  {
    key: "silver2",
    name: "Silver 2",
    color: "#B5A5B7",
  },
  {
    key: "silver3",
    name: "Silver 3",
    color: "#B5A5B7",
  },
  {
    key: "gold1",
    name: "Gold 1",
    color: "#F6A51E",
  },
  {
    key: "gold2",
    name: "Gold 2",
    color: "#F6A51E",
  },
  {
    key: "gold3",
    name: "Gold 3",
    color: "#F6A51E",
  },
  {
    key: "plat1",
    name: "Platinum 1",
    color: "#91E8E0",
  },
  {
    key: "plat2",
    name: "Platinum 2",
    color: "#91E8E0",
  },
  {
    key: "plat3",
    name: "Platinum 3",
    color: "#91E8E0",
  },
  {
    key: "diamond1",
    name: "Diamond 1",
    color: "#5DDFF4",
  },
  {
    key: "diamond2",
    name: "Diamond 2",
    color: "#5DDFF4",
  },
  {
    key: "diamond3",
    name: "Diamond 3",
    color: "#5DDFF4",
  },
  {
    key: "master1",
    name: "Master 1",
    color: "#6847BA",
  },
  {
    key: "master2",
    name: "Master 2",
    color: "#6847BA",
  },
  {
    key: "master3",
    name: "Master 3",
    color: "#6847BA",
  },
  {
    key: "grandmaster",
    name: "Grandmaster",
    color: "#E51D13",
  },
] as const;

const ranksByKey = keyBy(ranks, "key");

export function getRankDetails(rank: string): { name: string; color?: string } {
  return ranksByKey[rank];
}
