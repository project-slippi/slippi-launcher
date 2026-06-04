type Props = {
  openingType: string;
};

const labels: Record<string, string> = {
  "counter-attack": "Counter Hit",
  "neutral-win": "Neutral",
  trade: "Trade",
};

export const OpeningTypeCell = ({ openingType }: Props) => <div>{labels[openingType] ?? openingType}</div>;
