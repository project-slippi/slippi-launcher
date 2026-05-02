import { RankedStatus } from "./ranked_status";
import styles from "./sidebar.module.css";
import { TournamentLinks } from "./tournament_links";

export const Sidebar = () => {
  return (
    <div className={styles.container}>
      <RankedStatus />
      <TournamentLinks />
    </div>
  );
};
