import type { PunishEvent } from "../types";

type Props = Pick<PunishEvent, "damage" | "damageRange">;

export const DamageCell = ({ damage, damageRange }: Props) => {
  let diffColor = "green";
  if (damage >= 70) {
    diffColor = "red";
  } else if (damage >= 35) {
    diffColor = "yellow";
  }

  return (
    <div>
      <div style={{ color: diffColor }}>{Math.trunc(damage)}%</div>
      <div>{damageRange}</div>
    </div>
  );
};
