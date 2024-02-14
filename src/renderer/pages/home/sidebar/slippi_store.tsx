import styled from "@emotion/styled";
import { Button } from "@mui/material";
import React from "react";

import { ExternalLink } from "@/components/external_link";
import shopImage from "@/styles/images/shop-image.png";

const SlippiStoreContainer = styled.div`
  transition: opacity 1s ease-in-out;
  height: 100%;
  background-color: #21ba44;
  & > div {
    height: 100%;
    width: 100%;
  }
`;

const Outer = styled.div`
  position: relative;
  flex: 1;
  overflow: hidden;
`;

const Image = styled.img`
  position: absolute;
  width: 100%;
  object-fit: cover;
`;

const ButtonContainer = styled.div`
  position: absolute;
  top: 160px;
  left: 40px;
  width: 220px !important;
`;

const CloseDateContainer = styled.div`
  position: absolute;
  top: 210px;
  left: 75px;
  width: 100%;
  color: white;
  font-size: 16px;
`;

export const SlippiStore = React.memo(function SlippiStore() {
  return (
    <Outer>
      <SlippiStoreContainer>
        <Image src={shopImage} />
        <ButtonContainer>
          <Button
            variant="contained"
            sx={{ color: "white", textTransform: "uppercase" }}
            color="secondary"
            fullWidth={true}
            LinkComponent={ExternalLink}
            href="https://start.gg/slippi/shop"
          >
            Click to Shop
          </Button>
        </ButtonContainer>
        <CloseDateContainer>Store Ends: 2/27/24</CloseDateContainer>
      </SlippiStoreContainer>
    </Outer>
  );
});
