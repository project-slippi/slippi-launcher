import { css } from "@emotion/react";

import { ExternalLink as A } from "@/components/external_link";
import spifShopBanner from "@/styles/images/ads/spif-shop-banner.png";

const getActiveBanner = () => {
  const now = new Date();
  const start = new Date("2024-12-25");
  const end = new Date("2025-01-12");

  if (now >= start && now <= end) {
    return { image: spifShopBanner, url: "https://spif.space/pages/spif-x-slippi" };
  }

  return undefined;
};

export const AdBanner = () => {
  const banner = getActiveBanner();

  if (!banner) {
    return null;
  }

  return (
    <div
      css={css`
        position: absolute;
        bottom: 10px;
        width: calc(100% - 40px);
        margin-left: -6px;
        text-align: center;
        overflow: hidden;
      `}
    >
      <A
        href={banner.url}
        css={css`
          display: inline-block;
        `}
      >
        <img
          src={banner.image}
          css={css`
            display: block;
            margin-left: auto;
            margin-right: auto;
            min-width: 500px;
            max-width: 800px;
            width: 100%;
            border-width: 1px;
            border-style: solid;
            border-color: black;
            box-shadow: 0 0 10px 5px rgb(0 0 0 / 25%);
          `}
        />
      </A>
    </div>
  );
};
