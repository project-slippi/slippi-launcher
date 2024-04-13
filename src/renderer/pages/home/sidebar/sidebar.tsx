import styled from "@emotion/styled";

import { RankedStatus } from "./ranked_status";
import { TournamentLinks } from "./tournament_links";

const Outer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-x: hidden;
`;

export const Sidebar = () => {
  return (
    <Outer>
      <RankedStatus />
      <TournamentLinks />
    </Outer>
  );
};
