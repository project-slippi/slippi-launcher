import bronze1 from "@/styles/images/ranks/rank_Bronze_I.svg";
import bronze2 from "@/styles/images/ranks/rank_Bronze_II.svg";
import bronze3 from "@/styles/images/ranks/rank_Bronze_III.svg";
import diamond1 from "@/styles/images/ranks/rank_Diamond_I.svg";
import diamond2 from "@/styles/images/ranks/rank_Diamond_II.svg";
import diamond3 from "@/styles/images/ranks/rank_Diamond_III.svg";
import gold1 from "@/styles/images/ranks/rank_Gold_I.svg";
import gold2 from "@/styles/images/ranks/rank_Gold_II.svg";
import gold3 from "@/styles/images/ranks/rank_Gold_III.svg";
import grandmaster from "@/styles/images/ranks/rank_Grand_Master.svg";
import master1 from "@/styles/images/ranks/rank_Master_I.svg";
import master2 from "@/styles/images/ranks/rank_Master_II.svg";
import master3 from "@/styles/images/ranks/rank_Master_III.svg";
import plat1 from "@/styles/images/ranks/rank_Platinum_I.svg";
import plat2 from "@/styles/images/ranks/rank_Platinum_II.svg";
import plat3 from "@/styles/images/ranks/rank_Platinum_III.svg";
import silver1 from "@/styles/images/ranks/rank_Silver_I.svg";
import silver2 from "@/styles/images/ranks/rank_Silver_II.svg";
import silver3 from "@/styles/images/ranks/rank_Silver_III.svg";
import unranked1 from "@/styles/images/ranks/rank_Unranked1.svg";
import unranked2 from "@/styles/images/ranks/rank_Unranked2.svg";
import unranked3 from "@/styles/images/ranks/rank_Unranked3.svg";

const mapping = {
  none: unranked1,
  banned: unranked2,
  pending: unranked3,
  bronze1,
  bronze2,
  bronze3,
  silver1,
  silver2,
  silver3,
  gold1,
  gold2,
  gold3,
  plat1,
  plat2,
  plat3,
  diamond1,
  diamond2,
  diamond3,
  master1,
  master2,
  master3,
  grandmaster,
} as const;

type Rank = keyof typeof mapping;

export function getRankIcon(rank: Rank): string {
  return mapping[rank] as string;
}
