import type { PlayerDisplayInfo } from "../types";

type Props = {
  info: PlayerDisplayInfo;
};

export const PlayerDisplay = ({ info }: Props) => (
  <div style={{ display: "flex", alignItems: "center" }}>
    <img src={info.characterIconUrl} height={24} width={24} style={{ marginRight: 10 }} />
    <div style={{ fontWeight: 500 }}>{info.name}</div>
  </div>
);
