import * as stylex from "@stylexjs/stylex";

import { colors } from "@/styles/tokens.stylex";

import { RankedStatus } from "./ranked_status";
import { TournamentLinks } from "./tournament_links";

const styles = stylex.create({
  container: {
    display: "flex",
    flexDirection: "column",
    flex: "1",
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.purpleDarker,
  },
});

export const Sidebar = () => {
  return (
    <div {...stylex.props(styles.container)}>
      <RankedStatus />
      <TournamentLinks />
    </div>
  );
};
