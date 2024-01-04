import styled from "@emotion/styled";

import { TournamentLinks } from "./tournament_links";
import { TwitterFeed } from "./twitter_feed";

const Outer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-x: hidden;
`;

export const Sidebar = () => {
  return (
    <Outer>
      <TwitterFeed />
      <TournamentLinks />
    </Outer>
  );
};
