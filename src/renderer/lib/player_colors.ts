import { exists } from "@common/exists";

function getPortColor(port?: number): string {
  switch (port) {
    case 1:
      return "#f15959";
    case 2:
      return "#6565FE";
    case 3:
      return "#FEBE3F";
    case 4:
      return "#4CE44C";
    default:
      return "#ffffff";
  }
}

function getTeamColor(teamId: number): string {
  switch (teamId) {
    case 0: // red team
      return getPortColor(1);
    case 1: // blue team
      return getPortColor(2);
    case 2: // green team
      return getPortColor(4);
    default:
      return getPortColor();
  }
}

export function getColor(port: number, teamId?: number) {
  if (exists(teamId)) {
    return getTeamColor(teamId);
  }
  return getPortColor(port);
}
