export const colors = {
  greenPrimary: "#72d07f", // Should be accessed with useTheme instead
  purplePrimary: "#b984bb", // Should be accessed with useTheme instead

  // These are used on the home/launch page
  grayDark: "#222222",
  greenDark: "#21BA45",
  greenDarker: "#208E2C",
  purpleLight: "#8665A0",
  purple: "#310057",
  purpleDark: "#29133B",
  purpleDarker: "#1B0B28",
  offGray: "#2D313A",
};

export function getPortColor(port?: number): string {
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

export function getTeamColor(teamId: number): string {
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

export function getColor(port: number, teamId: number | null) {
  if (teamId !== null) {
    return getTeamColor(teamId);
  }
  return getPortColor(port);
}
