type Props = {
  damage: number;
};

export const DamageCell = ({ damage }: Props) => {
  let diffColor = "green";
  if (damage >= 70) {
    diffColor = "red";
  } else if (damage >= 35) {
    diffColor = "yellow";
  }

  return <div style={{ color: diffColor }}>{Math.trunc(damage)}%</div>;
};
