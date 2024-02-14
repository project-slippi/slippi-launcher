import styled from "@emotion/styled";

import { SlippiStore } from "./slippi_store";
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
      <SlippiStore />
      <TournamentLinks />
    </Outer>
  );
};
